# CampusOS Plugin Development Guide

Welcome to the CampusOS Plugin Development Guide! CampusOS uses a highly modular, event-driven, and dependency-aware architecture. This means you can extend the core platform with 3rd-party features (like Recruitment, Alumni Networking, or Custom Stores) without touching the core repository.

This guide will walk you through creating a completely isolated CampusOS plugin.

---

## 1. Plugin Structure

Every plugin must live in its own directory inside the `plugins/` folder. A typical plugin structure looks like this:

```text
plugins/
└── recruitment/
    ├── plugin.json                 # (Required) Metadata, permissions, capabilities & slots
    ├── package.json                # (Optional) Module-specific dependencies
    ├── vitest.config.js            # Isolated test runner configuration
    │
    ├── backend/
    │   ├── migrations/             # (Optional) Automated database migrations
    │   │   └── 001_initial_schema.js
    │   └── src/
    │       ├── index.js            # (Required) Backend Entry point (init & destroy)
    │       ├── controller/         # Express controllers (Factory pattern)
    │       ├── routes/             # Express route definitions
    │       ├── repository/         # Mongoose repository layer
    │       ├── service/            # Business logic (Factory pattern)
    │       └── schema/             # Mongoose models
    │
    └── frontend/
        ├── init.ts                 # Registers components into <ExtensionPoint> slots
        ├── api.ts                  # Typed API clients & React Query hooks
        ├── components/             # Internal UI components specific to plugin
        └── hooks/                  # Custom React hooks (e.g. useApplications)
```

---

## 2. The Manifest (`plugin.json`)

The plugin loader requires a `plugin.json` manifest at the root of the plugin directory to perform dependency resolution, capability verification, and topological sorting:

```json
{
  "name": "recruitment",
  "version": "1.0.0",
  "description": "Handles club member applications and interview workflows",
  "tier": "community",
  "defaultEnabled": true,
  "backend": true,
  "frontend": true,
  "dependencies": {
    "club": "^1.0.0",
    "auth": "^1.0.0"
  },
  "capabilities": ["service:club", "event:bus:emit"],
  "consumes": {
    "resolvers": ["club:getMemberRoles"],
    "events": ["club.member.resigned"]
  },
  "themeColor": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
}
```

> **Authoritative Manifest Specification**: For the complete field-by-field specification, validation contracts, and error handling rules, see [The Plugin Manifest Specification](/docs/plugins/backend/manifest).
>
> - **Permissions**: Declared dynamically in backend code via `registry.permissions.registerAll()` (see Section 4).
> - **Slots / UI Extensions**: Registered dynamically in frontend code via `registerExtension()` (see Section 5).

---

## 3. Database Migrations (`backend/migrations/`)

If your plugin introduces new collections or indexes, place migration scripts in `backend/migrations/`. They execute sequentially during server startup **before** `init()` is called:

```javascript
// plugins/recruitment/backend/migrations/001_initial_schema.js
export async function up({ db, mongoose, logger }) {
  logger.info('Creating recruitment campaign and applicant indexes');
  const campaigns = db.collection('recruitment_campaigns');
  await campaigns.createIndex({ clubId: 1, status: 1 });

  const candidates = db.collection('recruitment_candidates');
  await candidates.createIndex({ campaignId: 1, email: 1 }, { unique: true });
}

export async function down({ db, mongoose, logger }) {
  logger.info('Rolling back recruitment indexes');
  const candidates = db.collection('recruitment_candidates');
  await candidates.dropIndex('campaignId_1_email_1');
}
```

CampusOS stores SHA-256 hashes of applied migrations in `_plugin_migrations` to prevent configuration drift.

---

## 4. The Backend Entry Point (`backend/src/index.js`)

Your plugin must export an `init` function (and optionally a `destroy` teardown function):

```javascript
import { registerRecruitmentRoutes } from './routes/recruitment.routes.js';
import { createRecruitmentService } from './service/recruitment.service.js';
import { RecruitmentRepository } from './repository/recruitment.repository.js';
import { createRecruitmentController } from './controller/recruitment.controller.js';

let syncTimer = null;

export async function init(app, registry, eventBus, logger) {
  // 1. Fetch cross-plugin services (e.g., RBAC middleware)
  const requirePermissions = registry.getService('requirePermissions');
  if (!requirePermissions) {
    throw new Error('Permission service is missing');
  }

  // 2. Instantiate repository and services (Dependency Inversion)
  const repository = new RecruitmentRepository();
  const recruitmentService = createRecruitmentService(repository, {
    eventBus,
    logger
  });
  const recruitmentController = createRecruitmentController(recruitmentService);

  // 3. Mount your Express routes
  registerRecruitmentRoutes(app, recruitmentController, requirePermissions);

  // 4. Register module with the service registry
  registry.registerModule('recruitment', {
    routes: [
      'GET /api/v1/recruitment/campaigns',
      'POST /api/v1/recruitment/campaigns'
    ]
  });

  // 5. Register atomic permissions for RBAC
  if (registry.permissions) {
    registry.permissions.register({
      id: 'recruitment:manage',
      module: 'recruitment',
      label: 'Manage Recruitment',
      description: 'Allows reviewing applications and scheduling interviews'
    });
  }

  // 6. Listen for system events
  eventBus.on('club:approved', async (data) => {
    logger.info(
      { clubId: data.clubId },
      'Club approved; initializing campaign defaults'
    );
  });

  // 7. Use registry.timers for periodic background tasks (prevents leaks)
  syncTimer = registry.timers.setInterval(
    () => {
      recruitmentService.archiveExpiredDrives();
    },
    1000 * 60 * 60
  );
}

// Optional teardown hook for clean runtime unloading (ADR-019)
export async function destroy(app, registry, eventBus, logger) {
  logger.info('Tearing down recruitment plugin resources...');
  if (syncTimer) {
    clearInterval(syncTimer);
  }
}

export default { init, destroy };
```

---

## 5. Frontend Extension Points & Slots (ADR-020)

CampusOS does not require rebuilding the whole frontend to add widgets. Instead, frontend plugins register their components into host **Extension Points** using `@campus-os/shared/plugin-registry`:

```tsx
// plugins/recruitment/frontend/init.ts
import { registry } from '@campus-os/shared/plugin-registry';
import { RecruitmentWidget } from './components/RecruitmentWidget';

export function initFrontend() {
  registry.registerWidget(
    'dashboard-stats', // Typed slot ID from slot-catalog
    'recruitment', // Plugin ID matching manifest name
    RecruitmentWidget, // React widget component
    {
      priority: 15, // Higher numbers render first
      condition: (context) => Boolean(context?.user?.id) // Optional visibility predicate
    }
  );
}
```

### In the Host Next.js Layout:

The host application renders registered extensions dynamically with isolated error boundaries:

```tsx
import { ExtensionPoint } from '@campus-os/shared/extension-point';

export function ClubDashboard({ club, activePlugins, user }) {
  return (
    <div className="space-y-6">
      <ExtensionPoint
        id="dashboard-stats"
        context={{ club, user }}
        activePlugins={activePlugins}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      />
    </div>
  );
}
```

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ExtensionPoint name="dashboard.widget" context={{ club }} />
    </div>

);
}

````

Every injected extension is wrapped in an `ExtensionErrorBoundary`, ensuring that if a widget throws a runtime error, only that widget displays a fallback card while the rest of the application functions normally.

---

## 6. Accessing the Design System

Plugins use the shared design system components without bundling duplicate libraries. The host injects UI primitives via `window.CampusOS.ui`:

```tsx
import { Button, Card, CardHeader, CardTitle, Badge } from '@campusos/design-system';

export function RecruitmentWidget({ context }) {
  return (
    <Card className="p-4 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Active Recruitment</CardTitle>
        <Badge variant="outline">3 Openings</Badge>
      </CardHeader>
      <Button size="sm" className="mt-2 w-full">View Applicants</Button>
    </Card>
  );
}
````

---

## 7. Routing and RBAC

Endpoints should be protected with granular atomic permissions:

```javascript
// routes/recruitment.routes.js
import { Router } from 'express';

export function registerRecruitmentRoutes(app, controller, requirePermissions) {
  const router = Router();

  const viewRecruitment = requirePermissions('recruitment:view');
  const manageRecruitment = requirePermissions('recruitment:manage');

  router.get('/campaigns', viewRecruitment, controller.getCampaigns);
  router.post('/campaigns', manageRecruitment, controller.createCampaign);

  app.use('/api/v1/recruitment', router);
}
```

---

## 8. Best Practices Checklist

1. **Dependency Inversion (DIP)**: Always inject repositories and eventBus into services; never import mongoose models directly across layers.
2. **Unified Error Handling**: Validate incoming requests with `Zod` and let the global `errorMiddleware` format 400 Bad Request responses.
3. **No Direct Module Imports**: Never do `import ... from '../../club/...'`. Use `eventBus` or `registry`.
4. **Scoped Timers**: Never call global `setInterval()`. Always use `registry.timers.setInterval()` so timers are automatically cleared on plugin unload.
5. **Implement `destroy()`**: Clean up any database listeners, file streams, or sockets.

---

## 9. Testing Plugins with Vitest

Every plugin has its own test suite:

```javascript
// plugins/recruitment/vitest.config.js
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
});
```

Run tests from the workspace root:

```bash
# Test single plugin
pnpm -C plugins/recruitment test -- --run

# Run all plugin tests
pnpm test
```

---

**See Also**: [Inter-Plugin EventBus](./EVENT_BUS.md) · [Backend Architecture](../architecture/BACKEND.md) · [Slot Catalog](../plugins/frontend/SLOT_CATALOG.md)

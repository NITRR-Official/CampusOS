# CampusOS Plugin Development Guide

Welcome to the CampusOS Plugin Development Guide! CampusOS uses a highly modular, event-driven, and dependency-aware architecture. This means you can extend the core platform with 3rd-party features (like Recruitment, Alumni Networking, or Custom Stores) without touching the core repository.

This guide will walk you through creating a completely isolated CampusOS plugin.

---

## 1. Plugin Structure

Every plugin must live in its own directory inside the `plugins/` folder of the CampusOS backend. A typical plugin structure looks like this:

```text
plugins/
└── recruitment/
    ├── plugin.json         # (Required) Metadata and dependencies
    ├── src/
    │   ├── index.js        # (Required) Entry point
    │   ├── controller/     # Express route handlers
    │   ├── routes/         # Express router definitions
    │   └── schema/         # Mongoose models
    └── package.json        # (Optional) If you have unique NPM dependencies
```

---

## 2. The Manifest (`plugin.json`)

The plugin loader requires a `plugin.json` manifest to perform dependency resolution and topological sorting. This ensures your plugin doesn't boot until the plugins it relies on are fully initialized.

```json
{
  "name": "recruitment",
  "version": "1.0.0",
  "description": "Handles club member applications and interviews",
  "defaultEnabled": true,
  "dependencies": {
    "club": "^1.0.0",
    "auth": "^1.0.0"
  }
}
```

> **Note**: CampusOS uses semantic versioning (`semver`). If the platform's `club` module version does not satisfy `^1.0.0`, your plugin will gracefully skip loading to prevent runtime crashes.

---

## 3. Frontend Development

CampusOS uses a Monorepo architecture for the frontend. Plugin-related React components and hooks should be housed _inside_ the plugin's `frontend/` directory, **not** in the core `frontend/app` monolith.

### Boilerplate Requirements

If your plugin includes a frontend, you must define the following `peerDependencies` in your plugin's `package.json` to ensure compatibility with the CampusOS host application:

```json
{
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0",
    "react-dom": "^18.2.0 || ^19.0.0",
    "lucide-react": "*",
    "@tanstack/react-query": "^5.0.0"
  },
  "dependencies": {
    "@campusos/design-system": "workspace:*"
  }
}
```

### The Design System

CampusOS provides a centralized design system containing all Shadcn UI components, Tailwind configurations, and CSS variables. By importing from this package, your plugin will seamlessly match the platform's premium aesthetic.

1. **Install the Design System:**
   Run `pnpm add @campusos/design-system --workspace` in your plugin directory.
2. **Build Your UI:**
   Import components directly from the design system package:

   ```tsx
   import { Button, Input, Card } from '@campusos/design-system';

   export function MyPluginDashboard() {
     return <Button>Click Me</Button>;
   }
   ```

3. **Route Integration:**
   The core Next.js application will import your component and wrap it in a Next.js route:

   ```tsx
   // frontend/app/(dashboard)/tasks/page.tsx
   import { TaskDashboard } from '@plugins/task/frontend/TaskDashboard';

   export default function TasksPage() {
     return <TaskDashboard />;
   }
   ```

   This approach keeps plugins self-contained while preserving Next.js server-side rendering (SSR) and build optimizations.

---

## 4. The Entry Point (`src/index.js`)

Your plugin must export an `init` function as its default or named export. The CampusOS plugin loader will dynamically import this file and invoke `init(app, registry, eventBus)`.

```javascript
import { registerRecruitmentRoutes } from './routes/recruitment.routes.js';

export async function init(app, registry, eventBus) {
  // 1. Fetch cross-plugin services (e.g., RBAC middleware)
  const requirePermissions = registry.getService('requirePermissions');
  if (!requirePermissions) {
    throw new Error('Permission service is missing');
  }

  // 2. Mount your Express routes
  registerRecruitmentRoutes(app, requirePermissions);

  // 3. Register your module with the system so the Frontend can discover it
  registry.registerModule('recruitment', {
    routes: [
      'GET /api/v1/recruitment/applications',
      'POST /api/v1/recruitment/apply'
    ]
  });

  // 4. Register your atomic permissions for the RBAC system
  if (registry.permissions) {
    registry.permissions.register({
      id: 'recruitment:manage',
      module: 'recruitment',
      label: 'Manage Recruitment',
      description: 'Allows reviewing applications and scheduling interviews'
    });
  }

  // 5. Optionally export your own services for OTHER plugins to use
  registry.registerService('recruitmentService', {
    getApplicantCount: async () => 42
  });

  // 6. Listen for system events
  eventBus.on('club.approved', (data) => {
    console.log(
      `Club ${data.clubId} was approved! Setup recruitment templates...`
    );
  });
}

export default init;
```

---

## 4. The Core APIs

When your `init` function is called, you are given three powerful objects:

### 1. `app` (Express App)

The raw Express application instance. You can mount your routers directly to it:
`app.use('/api/v1/recruitment', recruitmentRouter)`

### 2. `registry` (Service Registry)

A centralized dependency injection container.

- **`registry.getService(name)`**: Grab an instance exported by another plugin.
- **`registry.registerService(name, instance)`**: Expose an API from your plugin.
- **`registry.registerModule(name, metadata)`**: Declare your plugin's existence to the `/api/v1/system/modules` endpoint.
- **`registry.permissions.register(permissionObj)`**: Inject your plugin's custom atomic permissions into the Discord-style RBAC UI.

### 3. `eventBus` (Pub/Sub)

A global `EventEmitter` for decoupling plugins.

- **`eventBus.emit('event.name', data)`**: Broadcast an event.
- **`eventBus.on('event.name', handler)`**: Listen for events triggered by other plugins.

---

## 5. Routing and RBAC (Role-Based Access Control)

CampusOS uses a strictly enforced Discord-style RBAC system. You should protect your endpoints by requiring the atomic permissions you registered in your `init` block.

```javascript
// routes/recruitment.routes.js
import express from 'express';

export function registerRecruitmentRoutes(app, requirePermissions) {
  const router = express.Router({ mergeParams: true });

  // Anyone can apply (Requires Authentication via token, but no specific club permission)
  router.post('/clubs/:clubId/apply', (req, res) => {
    res.json({ success: true, message: 'Applied!' });
  });

  // Only users with 'recruitment:manage' in this specific club can view applications
  router.get(
    '/clubs/:clubId/applications',
    requirePermissions('recruitment:manage'),
    (req, res) => {
      res.json({ success: true, applications: [] });
    }
  );

  app.use('/api/v1', router);
}
```

> **Dynamic Contexts:** By default, `requirePermissions` looks for a `:clubId` parameter. If your plugin uses a different context (like `:instituteId`), you must register a **Context Resolver** in your `init` block. See the `rbac-and-security.md` documentation for details.

---

## 6. Best Practices

1. **Dependency Injection for Core Models**: Never use relative imports to reach out of your plugin into the monolith (e.g. `import User from '../../../../../backend/src/...'`). Instead, fetch the system's `User` and `Plugin` models from `registry.getService('core:models')` during your `init` function.
2. **Unified Error Handling**: Never create your own local `createHttpError` functions. Always import and throw `AppError` from the core for generic domain errors. The global error middleware will automatically format it.
3. **EventBus Hygiene**: Always namespace your events (e.g., `recruitment:applied`), only emit lightweight IDs (not full objects) to avoid mutation traps, and ensure listeners use `async` to prevent blocking the main Node.js event loop.
4. **Register everything**: Always register your module and permissions so the Frontend UI can render checkboxes and routes dynamically.
5. **Database Isolation**: Keep your Mongoose models self-contained inside your plugin's `schema/` folder.
6. **Use Semver**: Always define your `dependencies` in `plugin.json`.

---

## 7. Testing Plugins

Plugins are developed in a monorepo structure and tested using `vitest`. When writing unit tests in your plugin directory, you can leverage the `@campusos/backend-core` path alias to resolve core database utilities.

1. **Create `vitest.config.js`** in your plugin's root:

```javascript
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@campusos/backend-core': path.resolve(__dirname, '../../backend/src')
    }
  },
  test: {
    globals: true,
    environment: 'node'
  }
});
```

2. **Write Unit Tests**: Use the alias in your `.test.js` files instead of messy relative paths:

```javascript
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';

beforeAll(async () => {
  await connectDB(mongoServer.getUri());
});
```

---

## 8. Publishing & Distributing Plugins

CampusOS makes it incredibly easy to share your plugins with other organizations or the open-source community. You don't need to publish to NPM; you can distribute your plugin directly via GitHub!

### Repository Structure

To make your plugin installable via GitHub, your repository must follow the exact structure of a generated plugin. **The `plugin.json` file must be at the root of the repository.**

```text
my-awesome-plugin/
"""?"? plugin.json         # MUST be at the root
"""?"? package.json
"""?"? backend/
",   """?"? src/
"""?"? frontend/
    """?"? pages/
```

### Installation

Administrators can install your plugin directly from your GitHub repository using the CLI:

```bash
# Using shorthand (User/Repo)
pnpm run plugin:install NITRR-Official/campus-os-recruitment

# Using full URL
pnpm run plugin:install https://github.com/NITRR-Official/campus-os-recruitment
```

The CLI will automatically:

1. Clone your repository.
2. Read the `plugin.json` to determine the plugin name.
3. Install the files into the `plugins/` directory.
4. Generate the necessary Next.js App Router wrappers for your frontend pages.
5. Wire up the `PluginRegistry` so your widgets and routes are instantly available!

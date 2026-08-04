# Plugin System

Every feature in CampusOS is a plugin module in `/plugins/`. Modules are loaded dynamically at startup — the backend core never hardcodes which modules exist.

## How Plugin Loading Works

At startup, `plugin-loader.js` does this:

```mermaid
flowchart TD
    Scan["1. Scan /plugins/ for directories"] --> ForEach["2. For each directory, look for entry file"]
    ForEach --> Check1{"Check: plugin.js exists?"}
    Check1 -- Yes --> Import["3. Dynamically import the entry file"]
    Check1 -- No --> Check2{"Check: src/index.js exists?"}
    Check2 -- Yes --> Import
    Check2 -- No --> Fail["Skip module"]

    Import --> Init["4. Call the exported init(app, registry) function"]
    Init --> Log["5. Log success or failure per module"]
```

> **Note (ADR-006):** Before loading a plugin, the loader checks the `Plugin` collection in MongoDB. If a plugin is marked as `enabled: false`, it is skipped. New, undiscovered plugins dropped into `/plugins/` are automatically inserted into MongoDB and disabled by default for security.

If a module fails to load:

- **Development**: Error is logged, other modules continue loading
- **Production**: The entire server crashes (fail-fast)

## Plugin Management (ADR 006)

Plugins are managed via the built-in `plugin-manager` module. This provides a `super-admin` API to list plugins, toggle them in MongoDB, and trigger a safe restart of the server (`SIGTERM`) to apply the new configuration dynamically without breaking the Express router stack.

## Frontend Plugin Architecture (ADR 007)

When a plugin introduces UI components, CampusOS uses **Build-Time Integration**. The frontend components are injected into the frontend directory, and the system runs `pnpm build`. This avoids complex micro-frontend configurations while maintaining perfect type safety and native performance.

## Real Plugin Entry Points

Here's what actual modules look like in the codebase:

### Auth module (`plugins/auth/src/index.js`)

```javascript
import { createAuthController } from './controller/auth.controller.js';
import { registerAuthRoutes } from './routes/auth.routes.js';

export async function init(app, registry) {
  const authController = createAuthController({ registry });
  registerAuthRoutes(app, authController);

  registry.registerModule('auth', {
    routes: ['/api/v1/auth/signup', '/api/v1/auth/login', '/api/v1/auth/me']
  });
}
```

### Vendor module (`plugins/vendor/src/index.js`)

```javascript
import { registerVendorRoutes } from './routes/vendor.routes.js';
import { createVendorService } from './service/vendor.service.js';
import { VendorRepository } from './repository/vendor.repository.js';
import { createVendorController } from './controller/vendor.controller.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  const vendorRepository = new VendorRepository();
  const vendorService = createVendorService(vendorRepository);
  const vendorController = createVendorController(vendorService);

  if (eventBus) vendorService.setEventBus(eventBus);

  registerVendorRoutes(app, vendorController, requirePermissions);

  if (registry.permissions) {
    registry.permissions.register({
      id: 'vendor:manage',
      module: 'vendor',
      label: 'Manage Vendors'
    });
  }
}
```

### Key patterns to notice:

1. **Export a named `init` function** (or default export) — the loader accepts either
2. **Receive `(app, registry, eventBus)` as arguments** — `app` is Express, `registry` is the service locator, `eventBus` is for cascade events
3. **Get shared services from the registry** — like `requirePermissions` for RBAC
4. **Register your routes directly on `app`** — there's no route aggregator
5. **Register your module in the registry** — `registry.registerModule('name', { routes })` for discoverability

## Module Directory Structure

Every module follows this layout:

```
plugins/<module>/
├── package.json              # Module dependencies
├── vitest.config.js          # Test configuration (if tests exist)
└── src/
    ├── index.js              # Plugin entry — exports init()
    ├── controller/
    │   └── <name>.controller.js
    ├── routes/
    │   └── <name>.routes.js
    ├── schema/
    │   └── <name>.schema.js  # Mongoose model
    └── service/
        ├── <name>.service.js
        └── <name>.service.test.js
```

## Current Modules

These are the actual directories in `/plugins/` right now:

| Module         | Directory                 | Layer      |
| -------------- | ------------------------- | ---------- |
| Auth           | `plugins/auth/`           | Foundation |
| Club           | `plugins/club/`           | Foundation |
| Institute      | `plugins/institute/`      | Foundation |
| Admin          | `plugins/admin/`          | Foundation |
| Plugin Manager | `plugins/plugin-manager/` | Foundation |
| Activity       | `plugins/activity/`       | Foundation |
| Event          | `plugins/event/`          | Event      |
| Check-in       | `plugins/checkin/`        | Event      |
| Forms          | `plugins/forms/`          | Event      |
| Task           | `plugins/task/`           | Execution  |
| Calendar       | `plugins/calendar/`       | Execution  |
| Recruitment    | `plugins/recruitment/`    | Execution  |
| Vendor         | `plugins/vendor/`         | Operations |
| Resource       | `plugins/resource/`       | Operations |
| Scheduling     | `plugins/scheduling/`     | Operations |
| Budget         | `plugins/budget/`         | Operations |

## Module Communication Rules

Modules cannot import each other. This is enforced by convention:

```javascript
// ❌ NEVER — this creates a hard dependency
import { UserService } from '../../auth/src/service/auth.service.js';

// ✅ Use the registry — loose coupling
const requirePermissions = registry.getService('requirePermissions');
```

Modules communicate through:

1. **The service registry** — `registry.getService('name')` / `registry.registerService('name', impl)`
2. **The database** — Modules can read any MongoDB collection, but each module owns its own collections

## Creating a New Module

### Step 1: Scaffold the directory

```bash
mkdir -p plugins/my-module/src/{controller,routes,schema,service}
```

### Step 2: Create the Mongoose schema

```javascript
// plugins/my-module/src/schema/my-module.schema.js
import mongoose from 'mongoose';

const myModuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  { timestamps: true }
);

export const MyModel = mongoose.model('MyModel', myModuleSchema);
```

### Step 3: Create the repository and service (business logic)

```javascript
// plugins/my-module/src/service/my-module.service.js
export function createMyModuleService(repository) {
  return {
    async create(data) {
      const doc = await repository.create(data);
      return { success: true, data: doc };
    },
    async getAll(filters = {}) {
      const docs = await repository.find(filters);
      return { success: true, count: docs.length, data: docs };
    }
  };
}
```

### Step 4: Create the controller (thin HTTP layer)

```javascript
// plugins/my-module/src/controller/my-module.controller.js
export function createMyModuleController(service) {
  return {
    async create(req, res, next) {
      try {
        const result = await service.create(req.body);
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
    async getAll(req, res, next) {
      try {
        const result = await service.getAll(req.query);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  };
}
```

### Step 5: Create the routes

```javascript
// plugins/my-module/src/routes/my-module.routes.js
import { Router } from 'express';

export function registerMyModuleRoutes(app, controller, requirePermissions) {
  const router = Router();

  router.get('/', controller.getAll);
  router.post('/', requirePermissions('my-module:manage'), controller.create);

  app.use('/api/v1/my-module', router);
}
```

### Step 6: Create the plugin entry

```javascript
// plugins/my-module/src/index.js
import { registerMyModuleRoutes } from './routes/my-module.routes.js';
import { createMyModuleService } from './service/my-module.service.js';
import { createMyModuleController } from './controller/my-module.controller.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  const service = createMyModuleService(); // Inject repo if used
  const controller = createMyModuleController(service);

  registerMyModuleRoutes(app, controller, requirePermissions);
}
```

The module will be automatically discovered and loaded on the next server start.

---

**See Also**: [Backend Architecture](./BACKEND.md) · [Architecture Overview](./OVERVIEW.md) · [API Standards](../guides/API_STANDARDS.md)

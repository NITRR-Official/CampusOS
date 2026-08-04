# Coding Guidelines

Code patterns and rules enforced in CampusOS, derived from the actual codebase.

## Module Rules

### 1. All features go in `/plugins/`

```
plugins/auth/        plugins/club/       plugins/institute/
plugins/event/       plugins/checkin/    plugins/task/
plugins/calendar/    plugins/vendor/     plugins/resource/
plugins/scheduling/  plugins/budget/
```

Backend core (`backend/src/`) only handles middleware, plugin loading, and the service registry.

### 2. Every module exports `init(app, registry, eventBus)`

```javascript
// plugins/my-module/backend/src/index.js
export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');
  // Initialize services and controllers
  registerRoutes(app, controller, requirePermissions);
  registry.registerModule('my-module', { routes: [...] });
}
```

### 3. No direct module imports

```javascript
// ❌ This creates a coupling that breaks the plugin system
import { AuthService } from '../../auth/src/service/auth.service.js';

// ✅ Use the registry
const requireRoles = registry.getService('requireRoles');
```

### 4. Module directory layout

```
plugins/<module>/src/
├── index.js              # Plugin entry (exports init)
├── controller/           # HTTP handlers (thin)
├── routes/               # Express route definitions
├── schema/               # Mongoose models
└── service/              # Business logic (tested)
    ├── module.service.js
    └── module.service.test.js
```

## Code Style

### ES Modules

The entire codebase uses ES module syntax:

```javascript
// ✅ Always
import express from 'express';
export function createApp() { ... }
export default createApp;

// ❌ Never
const express = require('express');
module.exports = createApp;
```

### Async/Await

```javascript
// ✅ Always
const result = await service.create(data);

// ❌ Never
service.create(data).then(result => { ... });
```

### Variable declarations

```javascript
// ✅ const by default
const vendors = await service.getAll();

// ✅ let only when mutation is needed
let retries = 3;
while (retries > 0) { ... retries--; }

// ❌ Never
var vendors = [];
```

## Controller Pattern

Controllers are created via factory functions. They extract params, call the service, and send the response:

```javascript
export function createVendorController(vendorService) {
  return {
    async createVendor(req, res, next) {
      try {
        const { name, category, email, phone } = req.body;
        // Centralized Zod middleware handles validation before this runs
        const result = await vendorService.createVendor({
          name,
          category,
          email,
          phone
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        return res.status(201).json(result.vendor);
      } catch (error) {
        return next(error);
      }
    }
  };
}
```

**Rules**:

- Controllers must be factories that accept services (Dependency Injection).
- Extract specific fields from `req.body` — don't spread the whole thing.
- Always wrap in `try/catch`.
- Always call `next(error)` in catch blocks.
- No business logic — that goes in services.

## Service Pattern

Services are created via factory functions and inject repositories:

```javascript
export function createVendorService(repository) {
  return {
    async createVendor(data) {
      // Zod has already validated `data` at the API layer
      const vendor = await repository.create(data);
      return { success: true, vendor };
    }
  };
}
```

**Rules**:

- Services must be factories that accept repositories. Never import Mongoose models directly.
- Return `{ success: true, data }` or `{ success: false, error }`.
- Don't throw for business errors — return error objects.
- Only throw for unexpected/system errors.

## Route Pattern

Routes register directly on `app` and use `requirePermissions` for RBAC:

```javascript
export function registerVendorRoutes(app, controller, requirePermissions) {
  app.post(
    '/api/v1/vendors',
    requirePermissions('vendor:manage'),
    controller.createVendor
  );
  app.get('/api/v1/vendors', controller.listVendors);
  app.delete(
    '/api/v1/vendors/:vendorId',
    requirePermissions('vendor:delete'),
    controller.deleteVendor
  );
}
```

## Naming Conventions

| Element          | Convention           | Example               |
| ---------------- | -------------------- | --------------------- |
| Files            | `kebab-case.js`      | `vendor.service.js`   |
| Variables        | `camelCase`          | `vendorService`       |
| Factories        | `camelCase`          | `createVendorService` |
| Classes (Repos)  | `PascalCase`         | `VendorRepository`    |
| Functions        | `camelCase`          | `createVendor`        |
| Constants        | `UPPER_SNAKE_CASE`   | `PUBLIC_ROUTES`       |
| React components | `PascalCase`         | `ThemeToggle`         |
| API routes       | `/api/v1/kebab-case` | `/api/v1/vendors`     |

## TypeScript (Frontend)

The frontend uses TypeScript. Backend is JavaScript.

```tsx
// Always type your API responses
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Use Zod for runtime validation
import { z } from 'zod';
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
```

## Package Management

- **pnpm only** — never use `npm` or `yarn`
- Install from root: `pnpm install`
- Module-specific: `pnpm -C plugins/vendor add <package>`
- Dev dependencies: `pnpm add -D <package>`

## Git Conventions

- Branch naming: `<type>/<issue>-<description>`
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
- Squash merge to `main`
- See [Git Workflow](../guides/GIT_WORKFLOW.md) for details

---

**See Also**: [Plugin System](../architecture/PLUGIN_SYSTEM.md) · [Code Review](../guides/CODE_REVIEW.md) · [API Standards](../guides/API_STANDARDS.md)

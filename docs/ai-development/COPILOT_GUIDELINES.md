# Copilot Guidelines

Rules for AI-assisted code generation in CampusOS. Read this before generating code.

## Architecture Rules

### The plugin contract

Every feature module lives in `/apps/<module>/` and exports:

```javascript
export async function init(app, registry) {
  // Get shared services
  const requireRoles = registry.getService('requireRoles');

  // Register routes
  registerRoutes(app, requireRoles);

  // Register module metadata
  registry.registerModule('my-module', { routes: [...] });
}
```

### Non-negotiable constraints

1. **No cross-module imports** — Use `registry.getService()` or `registry.getAuthenticator()`
2. **Controllers are thin** — Extract params, call service, send response, `next(error)` in catch
3. **Services return result objects** — `{ success: true, data }` or `{ success: false, error }`
4. **ES modules only** — `import`/`export`, never `require()`
5. **Routes use `requireRoles()`** — Write endpoints must have role guards

### Module directory structure

```
apps/<module>/src/
├── index.js                    # Exports init(app, registry)
├── controller/<name>.controller.js
├── routes/<name>.routes.js
├── schema/<name>.schema.js     # Mongoose model
└── service/
    ├── <name>.service.js
    └── <name>.service.test.js
```

## Technology Facts

| Component | Technology | Notes |
|-----------|-----------|-------|
| Backend runtime | Node.js 18+ (ES Modules) | No TypeScript on backend |
| Backend framework | Express.js | — |
| Frontend | Next.js 16.2.2 (App Router, webpack) | NOT Turbopack by default |
| Frontend UI | shadcn/ui + Radix UI + Tailwind CSS v4 | — |
| Forms | react-hook-form + Zod | — |
| Database | MongoDB + Mongoose | — |
| Auth | JWT (HS256, 15m default expiry) | via `jwt-authenticator.js` |
| Testing | Vitest + mongodb-memory-server | — |
| Package manager | pnpm (workspaces) | — |

## Common Pitfalls

```javascript
// ❌ Business logic in controllers
if (amount > budget.totalAllocation) {
  return res.status(400).json({ error: 'Over budget' });
}

// ✅ Business logic in services
const result = await budgetService.logExpense(budgetId, data);
if (!result.success) {
  return res.status(400).json({ error: result.error });
}
```

```javascript
// ❌ Importing between modules
import { UserService } from '../../auth/src/service/auth.service.js';

// ✅ Using the registry
const requireRoles = registry.getService('requireRoles');
```

```javascript
// ❌ Using require()
const express = require('express');

// ✅ ES module import
import express from 'express';
```

## Existing Modules

These directories exist in `/apps/`:

`auth`, `club`, `institute`, `event`, `checkin`, `task`, `calendar`, `vendor`, `resource`, `scheduling`, `budget`

## Key Files to Reference

- `backend/src/app.js` — Middleware chain and plugin loading order
- `backend/src/utils/registry.js` — Service registry API
- `backend/src/middleware/auth.js` — Public route whitelist
- `backend/src/middleware/permissions.js` — `requireRoles()` implementation
- `apps/vendor/src/index.js` — Example plugin entry point
- `apps/vendor/src/controller/vendor.controller.js` — Example controller pattern
- `apps/vendor/src/service/vendor.service.test.js` — Example test structure

---

**See Also**: [Architecture Overview](../architecture/OVERVIEW.md) · [Plugin System](../architecture/PLUGIN_SYSTEM.md) · [Coding Guidelines](../contributing/CODING_GUIDELINES.md)

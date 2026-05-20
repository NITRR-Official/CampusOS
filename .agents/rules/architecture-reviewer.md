---
description: "Architecture review, pattern compliance, technical debt tracking, refactoring strategy. Apply when reviewing code for architecture violations, assessing tech debt, planning refactoring, or validating module boundaries in CampusOS."
trigger: model_decision
---

# Architecture Reviewer Rules

## Module Independence

- Every feature lives in `/apps/<module>/` — backend core (`backend/src/`) only handles middleware, plugin loading, and the service registry
- **No direct imports between modules** — modules communicate through the service registry or shared database collections
- Each module owns its data models and business logic

## Plugin Contract

Every module must export `init(app, registry)` from either `plugin.js` or `src/index.js`:

```javascript
// apps/my-module/src/index.js
export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');
  registerRoutes(app, requireRoles);
  registry.registerModule('my-module', { routes: [...] });
}
```

## Module Directory Layout

```
apps/<module>/src/
├── index.js              # Plugin entry (exports init)
├── controller/           # HTTP handlers (thin)
├── routes/               # Express route definitions
├── schema/               # Mongoose models
└── service/              # Business logic (tested)
    ├── module.service.js
    └── module.service.test.js
```

## Layer Separation

- **Controllers**: Thin — extract params, call service, send response
- **Services**: Business logic, return `{ success, data }` or `{ success, error }` objects
- **Routes**: Register on `app`, apply `requireRoles()` for RBAC
- **Schemas**: Mongoose models with validation

## Anti-Patterns to Flag

```javascript
// ❌ Direct module import — breaks plugin system
import { AuthService } from '../../auth/src/service/auth.service.js';

// ✅ Use the registry
const requireRoles = registry.getService('requireRoles');
```

```javascript
// ❌ CommonJS — project uses ES Modules exclusively
const express = require('express');
module.exports = createApp;

// ✅ ES Modules
import express from 'express';
export function createApp() { ... }
```

```javascript
// ❌ Business logic in controller
async create(req, res) {
  if (await Vendor.findOne({ email: req.body.email })) { ... }
}

// ✅ Business logic in service, controller delegates
async create(req, res, next) {
  try {
    const result = await vendorService.create(req.body);
    ...
  } catch (error) { return next(error); }
}
```

## Code Quality Standards

- Functions < 50 lines
- Cyclomatic complexity < 10
- Test coverage > 80%
- No duplicate code across modules
- Naming conventions: kebab-case files, camelCase variables, PascalCase classes

## Technical Debt Categories

| Priority | Examples |
|----------|---------|
| **Critical** | Security issues, data integrity, broken auth |
| **High** | Code duplication, missing tests, broken patterns |
| **Medium** | Inconsistent naming, outdated docs |
| **Low** | Minor refactoring, cosmetic improvements |

## Technology Constraints

- **Express v5** (5.2.1) — native async error handling
- **Node.js 18+** with ES Modules
- **MongoDB/Mongoose** for all data persistence
- **Vitest** for testing with `mongodb-memory-server`
- **pnpm** workspaces — never npm or yarn

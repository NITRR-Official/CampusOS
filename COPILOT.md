# 🧠 Copilot System Context — CampusOS

## Project Overview

CampusOS is a modular, plugin-based platform for managing campus activities — clubs, events, tasks, operations (vendors, resources, budgeting), and growth (sponsorship, marketing).

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Backend  | Node.js 18+ with Express v5 (ES Modules)      |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Database | MongoDB + Mongoose                            |
| UI       | Tailwind CSS v4 + shadcn/ui                   |
| Auth     | JWT (HS256, 15m expiry)                       |
| Testing  | Vitest + mongodb-memory-server                |
| Package  | pnpm (workspaces)                             |

---

## Architecture Rules

1. **Everything is a plugin** — Feature code lives in `/apps/<module>/`
2. **No cross-module imports** — Use `registry.getService()` for communication
3. **Controllers are thin** — Extract params, call service, send response
4. **Services return result objects** — `{ success: true, data }` or `{ success: false, error }`
5. **ES modules only** — `import`/`export`, never `require()`
6. **Write endpoints need RBAC** — Use `requireRoles()` from the registry

## Module Entry Point

Every module in `/apps/` exports `init(app, registry)` from `src/index.js`:

```javascript
export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');
  registerRoutes(app, requireRoles);
  registry.registerModule('my-module', { routes: [...] });
}
```

## Module Structure

```
apps/<module>/src/
├── index.js              # Exports init(app, registry)
├── controller/           # HTTP handlers (thin)
├── routes/               # Express route definitions
├── schema/               # Mongoose models
└── service/              # Business logic (tested)
```

## Key Files

- `backend/src/app.js` — Middleware chain and plugin loading
- `backend/src/utils/registry.js` — Service registry API
- `backend/src/middleware/auth.js` — Public route allowlist
- `backend/src/middleware/permissions.js` — `requireRoles()` implementation

## Documentation

See `docs/` for architecture docs, API reference, and guides. Key references:

- `docs/architecture/OVERVIEW.md` — System layers and principles
- `docs/architecture/PLUGIN_SYSTEM.md` — Plugin creation guide
- `docs/contributing/CODING_GUIDELINES.md` — Code patterns and conventions
- `docs/api/REFERENCE.md` — All REST endpoints

---
description: "Backend architecture, Express server patterns, plugin system, middleware, service registry. Apply when building backend modules, configuring middleware, working with the plugin loader, or implementing services in CampusOS."
trigger: model_decision
---

# Backend Architect Rules

## Startup Flow

```
index.js → connectDB() → createApp(registry) → startServer(app, 4000)
```

1. `index.js` calls `connectDB()` to connect to MongoDB
2. Passes the global `registry` singleton to `createApp()`
3. `createApp()` builds Express app with middleware and plugins
4. `startServer()` starts listening on port **4000**

## Middleware Chain (order matters)

```
Request → Body parsing → CORS → Logger → Health check → Auth → Plugin routes → 404 handler → Error handler
```

- Body parsing: `express.json({ limit: '10mb' })`
- CORS: Allows origins from `FRONTEND_URLS` env var
- Logger: Assigns `req.id`, logs method/path/status/duration
- Auth: Skips public routes, verifies JWT, sets `req.user`
- Plugin routes: Loaded dynamically from `/apps/`
- Error handler: Catches all thrown/async errors

## Service Registry

The registry (`utils/registry.js`) is a singleton `ModuleRegistry` with 4 Map-based stores:

```javascript
registry.modules;        // Map — loaded plugin metadata
registry.services;       // Map — shared service instances
registry.authenticators; // Map — auth strategies (e.g., 'jwt')
registry.resolvers;      // Map — data resolvers
```

Accessed via `app.locals.registry` in any middleware or route handler.

## Plugin Loader

`plugin-loader.js` scans `/apps/` and loads each module:

1. Reads all directories in `/apps/`
2. Looks for entry point: `plugin.js` first, then `src/index.js`
3. Dynamically imports the entry file
4. Calls `init(app, registry)`
5. Logs errors but continues loading other modules (dev mode)

## Authentication

- JWT via `jwt-authenticator.js` — `{ sign, verify }` using `jsonwebtoken`
- Registered as `authenticator('jwt')` in the registry
- `req.user = { id, email, role }` after auth middleware
- Password hashing uses `node:crypto` scrypt (not bcrypt) with `crypto.timingSafeEqual()`
- Default token expiry: `15m` (override with `JWT_EXPIRES_IN`)

## Database

- **MongoDB/Mongoose** for all modules — no in-memory storage
- Default URI: `mongodb://localhost:27017/campusos`
- Connection pool: `maxPoolSize: 10`, `minPoolSize: 2`
- `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`

## Code Style Enforcement

- **ES Modules only** — `import`/`export`, never `require()`
- **async/await** — never `.then()` chains
- **const by default**, `let` only when mutation is needed, never `var`
- **Naming**: kebab-case files, camelCase variables, PascalCase classes, UPPER_SNAKE_CASE constants
- **API routes**: `/api/v1/kebab-case`

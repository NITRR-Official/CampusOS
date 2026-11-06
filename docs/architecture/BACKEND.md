# Backend Architecture

How the CampusOS Express server actually works, traced through the source code.

> **Note**: The backend uses Express **v5** (5.2.1). This means async error handling works natively in route handlers — thrown errors are caught by the error middleware without needing `express-async-errors`.

## Startup Flow

When you run `pnpm dev` in the backend (which runs `node --watch src/index.js`), this is what happens:

```mermaid
flowchart TD
    A["index.js<br/><small>Process Entrypoint</small>"] --> B["connectDB()<br/><small>Mongoose connection to MongoDB</small>"]
    B --> C["createApp(registry)<br/><small>App initialization & Core services</small>"]

    subgraph CoreInit ["Core Setup"]
        C --> D1["Register Models & Services<br/><small>User, Plugin, RequestContext, Logger</small>"]
        D1 --> D2["Apply Global Middleware<br/><small>RequestContext, Helmet, JSON/URL, CORS, RateLimit, Logger</small>"]
        D2 --> D3["Public System Endpoints<br/><small>/health, /system/modules, /system/permissions, /plugin-bundles</small>"]
        D3 --> D4["Register JWT Authenticator & RBAC Services<br/><small>requirePermissions, requireSuperAdmin</small>"]
    end

    CoreInit --> E["loadPlugins(app, registry)<br/><small>Plugin discovery & lifecycle engine</small>"]

    subgraph PluginBoot ["Plugin Boot Sequence"]
        E --> P1["1. Scan /plugins/ & validate plugin.json"]
        P1 --> P2["2. Verify Provenance & Capabilities (Core vs Community)"]
        P2 --> P3["3. Resolve Topological Dependencies"]
        P3 --> P4["4. Run Pending Database Migrations (MigrationRunner)"]
        P4 --> P5["5. Invoke init(app, scopedRegistry, scopedEventBus, logger)"]
    end

    PluginBoot --> F["Mount Global Error & 404 Handlers"]
    F --> G["startServer(app, port 4000)<br/><small>HTTP Server with Graceful Shutdown</small>"]
```

1. `index.js` connects to MongoDB via `connectDB()`.
2. It passes the global `registry` singleton to `createApp()`.
3. `createApp()` registers core models (`User`, `Plugin`), RequestContext, and root logger.
4. Security middleware (`helmet`, `cors`, rate-limiting) and auth infrastructure are mounted.
5. `loadPlugins()` scans the `/plugins/` directory, validates manifests, checks dependencies, runs automated database migrations via `MigrationRunner`, and calls `init()` on each plugin.
6. `startServer()` starts listening on port `4000` with graceful shutdown handlers (`SIGTERM`, `SIGINT`).

If MongoDB is unreachable or any step fails in production, the process exits with code `1`.

## File Map

```
backend/src/
├── index.js                     # Entry point — calls connectDB → createApp → startServer
├── app.js                       # Creates Express app, loads middleware + plugins
├── server.js                    # HTTP server with graceful shutdown (SIGTERM / SIGINT)
├── plugin-loader.js             # Discovers, validates, migrates, inits & unloads plugins
│
├── core/
│   ├── event-bus.js             # Core asynchronous EventBus singleton
│   ├── sandbox-event-bus.js     # Scoped EventBus sandbox with auto-cleanup on unload
│   ├── permission-registry.js   # Dynamic atomic RBAC permission registry
│   ├── sandbox-registry.js      # Scoped ModuleRegistry sandbox with timer cleanup
│   ├── plugin-provenance.js     # Provenance verification & capability enforcement
│   ├── request-context.js       # AsyncLocalStorage-backed request cache
│   └── logger.js                # Pino structured logger with child context
│
├── auth/
│   └── jwt-authenticator.js     # JWT sign/verify, registered as authenticator('jwt')
│
├── middleware/
│   ├── auth.js                  # JWT verification, public route allowlist
│   ├── permissions.js           # requirePermissions(), requireSuperAdmin() RBAC factories
│   ├── request-context.middleware.js # Injects request-scoped store & correlation IDs
│   ├── logger.js                # Request logging with trace IDs and duration
│   └── error.js                 # Zod validation & global error handlers + 404 handler
│
├── database/
│   ├── connection.js            # Mongoose connect/disconnect/healthCheck & DatabaseManager
│   ├── migration-runner.js      # Automated forward up() & rollback down() schema migrations
│   └── schemas/                 # Core Mongoose models (User, Plugin, MigrationLog)
│
├── routes/
│   └── plugin-bundle.routes.js  # Serves compiled frontend ESM bundles & manifests (ADR-014)
│
└── utils/
    └── registry.js              # ModuleRegistry class — service locator
```

## Middleware Chain

The order in `app.js` matters. Middleware runs top-to-bottom for every request:

```mermaid
flowchart TD
    Req["Request arrives"] --> M0["0. Request Context<br/><small>AsyncLocalStorage & request-scoped cache</small>"]
    M0 --> M1["1. Security Headers<br/><small>helmet()</small>"]
    M1 --> M2["2. Body Parsing<br/><small>express.json({ limit: '2mb' }), express.urlencoded()</small>"]
    M2 --> M3["3. CORS<br/><small>Allows origins from FRONTEND_URLS env var & Vercel previews</small>"]
    M3 --> M4["4. Rate Limiter<br/><small>500 requests / 15 min window</small>"]
    M4 --> M5["5. Logger<br/><small>Assigns req.id, logs method, path, status, duration</small>"]
    M5 --> M6["6. Health & System Discovery<br/><small>GET /health, /system/modules, /system/permissions</small>"]
    M6 --> M7["7. Frontend Plugin Bundles<br/><small>GET /api/v1/plugins/:name/bundle.js (ADR-014)</small>"]
    M7 --> M8["8. Auth Middleware<br/><small>Skips public routes, verifies JWT, sets req.user</small>"]
    M8 --> M9["9. Plugin Routes<br/><small>Mounted dynamically from /plugins/<name>/backend/</small>"]
    M9 --> M10["10. 404 Handler<br/><small>notFoundMiddleware — catches unmatched routes</small>"]
    M10 --> M11["11. Error Handler<br/><small>errorMiddleware — catches Zod and thrown errors</small>"]
```

### Public Routes (No Auth Required)

Public routes are handled dynamically to support the plugin system:

- `GET /health` — Database health probe
- `GET /api/v1/system/modules` — List active modules
- `GET /api/v1/system/permissions` — List registered permissions grouped by module
- `GET /api/v1/plugins/:name/manifest` — Plugin manifest for frontend runtime
- `GET /api/v1/plugins/:name/bundle.js` — Compiled frontend ESM micro-bundle
- `POST /api/v1/auth/signup` & `POST /api/v1/auth/login`

Plugins dynamically register public paths via `registry.registerPublicRoute(pattern)`. The auth middleware calls `registry.getPublicRoutes()` and permits access if the request path matches. Everything else requires a valid `Bearer <token>` in the `Authorization` header.

## Automated Plugin Schema Migrations Engine

CampusOS includes an automated database migration engine (`database/migration-runner.js`, ADR-021) that runs during server boot **before** a plugin's `init()` function is invoked:

```mermaid
flowchart TD
    Start["PluginLoader loads Plugin"] --> Scan["Scan /plugins/<name>/backend/migrations/"]
    Scan --> CheckDB["Query _plugin_migrations collection for applied migrations"]
    CheckDB --> CheckSum{"Verify Checksums of applied migrations"}
    CheckSum -- Checksum Mismatch --> Fail["Throw MigrationChecksumError (Halt Boot)"]
    CheckSum -- Clean --> Pending{"Any Pending Migrations?"}
    Pending -- No --> Proceed["Invoke plugin init()"]
    Pending -- Yes --> Loop["Execute pending up() hooks sequentially"]
    Loop --> Record["Record in _plugin_migrations (checksum, executionTime, timestamp)"]
    Record --> Proceed
```

### Key Migration Features:

1. **Directory Convention**: Migrations live in `plugins/<module>/backend/migrations/` and follow lexical naming (e.g. `001_initial_schema.js`, `002_add_indexes.js`).
2. **Contract**: Each migration exports `up(context)` and `down(context)`:

   ```javascript
   export async function up({ db, mongoose, logger }) {
     await db
       .collection('calendar_events')
       .createIndex({ startTime: 1, endTime: 1 });
   }

   export async function down({ db, mongoose, logger }) {
     await db.collection('calendar_events').dropIndex('startTime_1_endTime_1');
   }
   ```

3. **Checksum Tamper-Proofing**: SHA-256 hashes of applied migrations are stored in `_plugin_migrations`. Modifying an applied migration script will prevent startup.
4. **Rollback Support**: On failure or plugin downgrade, `down()` hooks can be triggered to revert database state safely.

## Plugin Lifecycle & Teardown

CampusOS implements a full lifecycle state machine for plugins (`plugin-loader.js`, ADR-019), supporting graceful runtime deactivation, resource cleanup, and hot reloading:

```mermaid
stateDiagram-v2
    [*] --> DISCOVERED: PluginLoader scans /plugins/
    DISCOVERED --> VALIDATED: Validate plugin.json against Zod schema
    VALIDATED --> PROVENANCE_CHECK: Verify signature & determine tier (core vs community)
    PROVENANCE_CHECK --> MIGRATING: Run pending database migrations
    MIGRATING --> ACTIVE: Invoke init(app, registry, eventBus, logger)
    ACTIVE --> UNLOADING: unloadPlugin(name) triggered
    UNLOADING --> DESTROYED: destroy(app, registry, eventBus, logger) & resources pruned
    DESTROYED --> [*]
```

### Resource Cleanup & Teardown (`destroy` Hook):

Plugins can export an optional `destroy(app, registry, eventBus, logger)` function (or `teardown`). When a plugin is deactivated:

1. **Timeout Safeguard**: `destroy()` is executed with a 5000ms timeout guard (`Promise.race`) so a hanging plugin hook cannot freeze the server.
2. **Dependency Tree Guard**: The loader verifies no other active plugin depends on this plugin before allowing deactivation (unless `force: true` is passed).
3. **Scoped Timers Cleanup**: Timers allocated via `registry.timers.setInterval()` or `setTimeout()` are automatically cleared.
4. **EventBus Listeners Unbound**: All subscriptions created via the plugin's scoped `eventBus.on()` are automatically removed to prevent memory leaks.
5. **Registry Pruning**: Services and routes registered by the plugin are pruned from the service locator.

## Service Registry & Scoped Sandboxing

The registry (`utils/registry.js`) is the central service locator and dependency injection container. It provides unified registries for business services, dynamic permissions, context resolvers, public route bypasses, stat providers, dynamic settings schemas, and leak-free scoped timers:

```javascript
registry.permissions; // Dynamic Atomic PermissionRegistry
registry.getAllModules(); // List loaded module names
registry.getAllServices(); // Map of registered services
registry.getService('serviceName'); // Retrieve shared service (with dependency validation)
registry.registerService(name, fn); // Expose service to other modules
registry.timers; // Scoped timer utilities (setInterval, setTimeout)
registry.registerContextResolver(); // Multi-tenant dynamic authorization resolver
registry.registerPublicRoute(); // Whitelist public endpoints from JWT auth
registry.registerStatProvider(); // Supply decentralized dashboard overview stats
registry.registerSettingsConfig(); // Register dynamic admin settings form schemas
```

> **Authoritative Registry Reference**: For the exhaustive method-by-method specification, context resolvers, stat providers, and sandboxed proxy examples, see [Backend Primitives & Service Registry](/docs/plugins/backend/services-and-events).

### Two-Tier Sandboxing (ADR-017):

- **Core Plugins** (`auth`, `plugin-manager`, `admin`, `club`, etc.): Granted unrestricted access to registry and core models (`grantedCapabilities: ['*']`).
- **Community Plugins**: Wrapped in a `ScopedRegistry` and `ScopedEventBus`. They can only access declared capabilities specified in their `plugin.json` manifest. Direct database access (`db:mongo`, `db:sql`, `core:models`) is blocked at the sandbox boundary.

## Dynamic Atomic RBAC

`middleware/permissions.js` exports `requirePermissions()` — a factory enforcing fine-grained atomic permissions registered dynamically by plugins:

```javascript
// Protected endpoint requiring specific atomic permission tokens:
router.post(
  '/',
  requirePermissions('event:create', 'calendar:write'),
  controller.create
);
```

### How Permissions Work:

1. When a plugin initializes, it registers its permissions via `registry.permissions.register()`:
   ```javascript
   registry.permissions.register({
     id: 'club:approve',
     module: 'club',
     label: 'Approve or Reject Club Registrations',
     description: 'Allows club administrators to transition club state'
   });
   ```
2. Dynamic permissions are queryable via `GET /api/v1/system/permissions`.
3. The RBAC middleware checks `req.user.permissions` or evaluates role-to-permission mappings dynamically, eliminating hardcoded role lists.

## Event Bus

The core EventBus (`core/event-bus.js`) enables asynchronous, decoupled communication between plugins:

```javascript
// In a service — emit domain event
eventBus.emit('club:created', { clubId, name, creatorId });

// In another plugin — listen for event
eventBus.on('club:created', async ({ clubId }) => {
  await calendarService.createClubDefaultCalendar(clubId);
});
```

- **Wildcard Subscriptions**: Supports pattern matching like `eventBus.on('club:*', handler)`.
- **Error Isolation**: Listener exceptions are caught and logged; an error in one listener never crashes the publisher or other listeners.

## Database Connection

`database/connection.js` manages MongoDB via Mongoose with high-throughput production pooling:

| Setting                    | Value   | Purpose                                      |
| -------------------------- | ------- | -------------------------------------------- |
| `serverSelectionTimeoutMS` | 5000ms  | Fast failure detection if MongoDB is down    |
| `socketTimeoutMS`          | 45000ms | Prevents hanging operations on stale sockets |
| `maxPoolSize`              | 10      | Concurrent connection pool limit             |
| `minPoolSize`              | 2       | Keeps warm connections ready                 |

Default URI: `mongodb://localhost:27017/campusos`  
Exports: `connectDB()`, `disconnectDB()`, `healthCheck()`, `isDBConnected()`, `databaseManager`.

## Testing Strategy

Testing in the CampusOS backend uses **Vitest** paired with **MongoDB Memory Server**:

1. **In-Memory Database**: Unit and integration tests instantiate a fresh in-memory MongoDB replica. No external Docker container or live database is needed.
2. **Per-Plugin Isolation**: Each plugin has its own test suite running with isolated schemas and clean collections.
3. **Mongoose Best Practices**: Tests verify modern Mongoose operations, enforcing `{ returnDocument: 'after' }` over deprecated options.
4. **Lifecycle & Migration Tests**: Dedicated test suites in `plugin-lifecycle.test.js` and `migration-runner.test.js` verify hook timeouts, rollbacks, and sandboxing under stress.
5. **Execution**:
   ```bash
   pnpm test                  # Run all tests across workspace
   pnpm -C plugins/calendar test -- --run   # Test a specific plugin
   ```

---

**See Also**: [Plugin System](./PLUGIN_SYSTEM.md) · [Architecture Overview](./OVERVIEW.md) · [Database Setup](../getting-started/DATABASE_SETUP.md) · [Event Catalog](./EVENT_CATALOG.md)

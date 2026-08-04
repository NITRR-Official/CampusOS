---
name: backend-setup
description: "Express server scaffolding, plugin architecture, middleware patterns for CampusOS. Use when starting backend development, adding middleware, troubleshooting server startup, or creating new plugin modules."
---

# Backend Setup

## When to Use

- Starting backend development or adding a new module
- Adding Express middleware
- Troubleshooting server startup
- Understanding the plugin architecture

## Procedure

### Phase 1: Project Structure

The backend lives in `/backend/src/`:
```
backend/src/
├── index.js              # Entry point — connectDB → createApp → startServer
├── app.js                # Express app, middleware + plugin loading
├── server.js             # HTTP server with graceful shutdown
├── plugin-loader.js      # Scans /plugins/ and calls init() on each module
├── auth/
│   └── jwt-authenticator.js
├── middleware/
│   ├── auth.js           # JWT verification, public route whitelist
│   ├── permissions.js    # requireRoles() RBAC middleware
│   ├── logger.js         # Request logging with trace IDs
│   └── error.js          # Error handler + 404 handler
├── database/
│   ├── connection.js     # Mongoose connect/disconnect/healthCheck
│   └── schemas/          # Mongoose models
└── utils/
    └── registry.js       # ModuleRegistry — service locator
```

### Phase 2: Creating a New Module

1. Create directory: `plugins/<module-name>/src/`
2. Create entry file (`src/index.js` or `plugin.js`):

```javascript
export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');
  // Register routes
  app.get('/api/v1/my-resource', controller.list);
  app.post('/api/v1/my-resource', requireRoles('admin', 'coordinator'), controller.create);
  // Register module
  registry.registerModule('my-module', { routes: ['/api/v1/my-resource'] });
}
```

3. Create module structure:
```
plugins/<module>/src/
├── index.js          # Plugin entry (exports init)
├── controller/       # Thin HTTP handlers
├── routes/           # Express route definitions
├── schema/           # Mongoose models
└── service/          # Business logic
    ├── module.service.js
    └── module.service.test.js
```

### Phase 3: Startup Flow

```
index.js → connectDB() → createApp(registry) → startServer(app, 4000)
```

- MongoDB must be running before startup
- Plugin loader scans `/plugins/` for `plugin.js` or `src/index.js`
- Failed plugins log errors but don't crash (dev mode)

### Phase 4: Middleware Order (in app.js)

```
Body parsing → CORS → Logger → Health check → Auth → Plugin routes → 404 → Error handler
```

This order is critical. Auth must come before plugin routes.

## Quick Reference

```bash
cd backend && pnpm install
pnpm dev              # Start with --watch (port 4000)
curl http://localhost:4000/health   # Test health
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check entry file exports `init()` — must be `plugin.js` or `src/index.js` |
| MongoDB connection failed | Ensure MongoDB is running: `docker start mongodb` |
| Port in use | Backend uses port 4000, check `PORT` env var |
| Services not found | Use `registry.getService('name')` — not direct imports |
| Module imports another module | Use registry or shared DB — never direct imports |

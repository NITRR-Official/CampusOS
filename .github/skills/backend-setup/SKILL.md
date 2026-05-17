---
name: backend-setup
description: 'Express server scaffolding, plugin architecture, middleware patterns. Use when: starting backend development, adding middleware, troubleshooting server startup, designing plugin systems.'
argument-hint: 'module-name, port, middleware-types'
---

# Backend Setup

## When to Use

- Starting backend development
- Adding Express middleware
- Troubleshooting server startup
- Designing plugin architecture
- Initializing new activity modules

## What This Skill Does

Scaffolds Express server with CampusOS plugin system, middleware templates, modular structure, and service initialization patterns.

## Procedure

### Phase 1: Project Structure

1. Start in `/backend/src/`
2. Create directory structure:
   ```
   src/
   ├── index.js
   ├── app.js
   ├── server.js
   ├── plugin-loader.js
   ├── middleware/
   │   ├── auth.js
   │   ├── error.js
   │   └── logger.js
   └── utils/
       └── registry.js
   ```

### Phase 2: Core Components

1. Create `index.js` - Express app initialization with `express()`
2. Create `app.js` - Load middleware in correct order (auth → routes → error handling)
3. Create `server.js` - HTTP server startup on configured PORT
4. Create `plugin-loader.js` - Dynamic module discovery from `/apps/`

### Phase 3: Middleware Implementation

1. Authentication middleware - Verify JWT/tokens before route handlers
2. Error handling middleware - Catch and format errors at end of chain
3. Logging middleware - Track all requests/responses
4. CORS configuration - Handle cross-origin requests

### Phase 4: Plugin System

1. Initialize module registry in `utils/registry.js`
2. Scan `/apps/` directory for modules with `index.js`
3. Call `module.init(app, registry)` for each module
4. Register routes via `app.post()`, `app.get()` from each module
5. Mount services/authenticators/resolvers

## Quick Reference

```bash
cd backend && pnpm install
npm run dev        # Start dev server with hot reload
npm run build      # Compile TypeScript (if used)
npm test          # Run integration tests
# Set custom port: PORT=3001 npm run dev
```

## Common Issues

| Issue                   | Solution                                                    |
| ----------------------- | ----------------------------------------------------------- |
| Plugin not loading      | Check `/apps/module/src/index.js` exports `init()` function |
| Middleware order wrong  | Place auth before routes, error handler at end of chain     |
| Port in use             | Change PORT env var or kill process: `lsof -i :3000`        |
| Routes undefined        | Verify module calls `app.post()` during init phase          |
| CORS errors             | Configure CORS middleware with allowed origins              |
| Services not registered | Ensure `registry.set()` called during module initialization |

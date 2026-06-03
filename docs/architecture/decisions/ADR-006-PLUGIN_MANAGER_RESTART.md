# ADR 006: Plugin Manager Config & Restart Pattern

## Status

Accepted

## Context

CampusOS is built on a highly modular plugin system where features (Auth, Vendor, Task, etc.) are separated into isolated directories under `/apps/`.

As the platform evolves, there is a desire to introduce a "Super Admin Dashboard" capable of installing, enabling, and disabling plugins dynamically. Initial discussions explored mimicking VS Code's "Extension Host" architecture (using Worker Threads for true runtime hot-swapping).

However, true runtime plugin hot-swapping in a Node.js/Express environment introduces severe complexity:

- **Express Routers**: Express lacks a native way to unbind/remove routes from the middleware stack.
- **Mongoose Models**: Deleting cached schemas at runtime causes memory leaks and registry conflicts.
- **ES Modules**: Cache busting for ES modules is highly unreliable.
- **Complexity**: It forces plugins to communicate via complex Inter-Process Communication (IPC) rather than simple shared memory.

## Decision

**Adopt the "Config & Restart" pattern for the Super Admin Plugin Manager.**

Instead of attempting complex in-memory hot-swapping, the platform will:

1. Allow the Super Admin Dashboard to manage plugin states by writing to a persistent configuration source (e.g., a `plugins.json` file or a database registry).
2. Trigger a graceful Node.js process restart (via PM2 or a container orchestrator like Docker) after a plugin is enabled, disabled, or installed.
3. Upon restart, the `plugin-loader.js` will read the configuration and cleanly mount only the active plugins.

## Rationale

1. **Simplicity** — Avoids monkey-patching Express routers or dealing with ES Module cache busting.
2. **Stability** — Ensures the Node.js event loop and Mongoose connections remain perfectly stable.
3. **Developer Experience** — Maintains the simple "Modular Monolith" architecture without forcing developers to write complex Inter-Process Communication (IPC) logic for plugins.
4. **Industry Standard** — Matches the proven pattern used by leading modular platforms like Ghost CMS and Strapi.

## Consequences

### Positive

- Extremely easy to implement compared to Worker Threads.
- 100% safe from memory leaks caused by dynamic unloading.
- Retains the simplicity of synchronous middleware and shared database connections.
- Aligns perfectly with the goal of improving the development flow so new features can be added rapidly.

### Negative

- Enabling, disabling, or installing a plugin causes a brief server restart.
- Requires the production environment to use a process manager capable of rolling restarts (like PM2 or Docker Swarm/Kubernetes) to minimize downtime for end-users during plugin changes.

## Related ADRs

- ADR-003: System Layers
- ADR-004: Development Strategy

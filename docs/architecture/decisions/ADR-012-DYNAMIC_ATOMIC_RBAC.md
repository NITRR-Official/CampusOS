# ADR-012: Dynamic Atomic Role-Based Access Control (RBAC)

## Context

Initially, CampusOS used broad, hardcoded roles (`admin`, `coordinator`, `volunteer`) passed into a `requireRoles` middleware. As the system scaled and plugins were decoupled, this became too rigid. A plugin couldn't define its own granular permissions (e.g., `event:delete`), and adding new roles required modifying core middleware, violating the Open/Closed Principle. Additionally, context-based permissions (like checking if a user is an admin of a _specific_ club) were handled inconsistently across controllers.

## Decision

We implemented a **Dynamic Atomic RBAC** system:

1. **Atomic Permissions**: Instead of broad roles, middleware now enforces specific permissions using `requirePermissions('plugin:action')`.
2. **Dynamic Registration**: Plugins register their available permissions at runtime via `registry.permissions.register({...})`.
3. **Roles to Permissions Mapping**: Roles are now just a collection of atomic permissions.
4. **Context Resolvers**: Plugins can register `contextResolvers` (e.g., resolving a `clubId` from a URL) so the permission middleware can automatically verify if the user has the required permission _within that specific context_.
5. **Super Admin Bypass**: A global `isSuperAdmin` flag allows bypassing atomic checks for system-level administrators.

## Rationale

This approach fully decouples authorization from the core router. Plugins define their own security requirements, making the system highly extensible. The middleware automatically handles context resolution, reducing repetitive permission-checking boilerplate in controllers.

## Consequences

- **Positive**: Plugins are entirely self-contained regarding their security model. UI components can dynamically render based on atomic permissions.
- **Negative**: The permission resolution logic is slightly more complex, and database queries for role-permission mappings must be optimized/cached to prevent latency spikes on every request.

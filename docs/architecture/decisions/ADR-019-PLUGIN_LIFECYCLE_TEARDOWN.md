# ADR-019: Plugin Lifecycle Teardown Hook and Graceful Resource Cleanup

## Status

Accepted

## Context

Prior to this decision, CampusOS plugins only exposed a one-way initialization lifecycle hook in `backend/src/plugin-loader.js`:

```javascript
export async function init(app, registry, eventBus, logger) { ... }
```

When an administrator disabled a plugin via the Admin UI (`PATCH /api/v1/plugins/:name/toggle`):

1. The status was toggled in MongoDB (`enabled: false`), but the active plugin in Node.js runtime memory remained completely untouched until an entire server reboot.
2. Background timers (`setInterval`, `setTimeout`), long-polling loops, open WebSocket/TCP connections, and child processes initialized by the plugin continued running indefinitely in the Node.js event loop.
3. Registered EventBus listeners (`eventBus.on()`) and registered services (`registry.registerService()`) remained active in memory, continuing to process events and respond to service requests even after being disabled.
4. Over time, repeatedly enabling and disabling plugins caused severe memory leaks, ghost event executions, and eventual Node.js process crashes.

## Decision

We establish an end-to-end **Plugin Teardown and Graceful Resource Cleanup Architecture (Issue #124)**:

### 1. Exportable `destroy()` / `teardown()` Lifecycle Hook

Plugin contracts (`@campus-os/shared/plugin-contract`) define an optional asynchronous cleanup hook:

```javascript
/**
 * Optional lifecycle hook invoked when the plugin is deactivated or unloaded.
 */
export async function destroy(app, registry, eventBus, logger) {
  // Clean up custom sockets, database connections, worker threads, etc.
}
```

Both `destroy` and `teardown` aliases are recognized and validated by `validatePluginModule(loadedModule, pluginName)`.

### 2. Runtime Module Unloader (`unloadPlugin`)

`backend/src/plugin-loader.js` exposes `unloadPlugin(pluginName, options)`:

- **Dependency Safety Check:** Before unloading, the loader inspects all other active plugins. If another running plugin depends on the target plugin (via `dependencies` SemVer range), the unload operation is rejected with `PluginContractError` unless `{ force: true }` is specified.
- **Timeout Safeguard:** The plugin's `destroy()` function is wrapped in `Promise.race` against a configurable timeout (default: 5,000ms). If a poorly written plugin hangs or rejects during teardown, the system logs a warning and proceeds with host-level cleanup to guarantee memory recovery.
- **Lifecycle Event Emission:** Once unloaded, the loader dispatches a `plugin:unloaded` event across the core EventBus:
  ```javascript
  await eventBus.emit('plugin:unloaded', { pluginName, timestamp });
  ```

### 3. Host-Enforced Scoped Resource Tracking & Cleanup

Plugins cannot be trusted to clean up 100% of their resources. Therefore, the host runtime intercepts and tracks all registrations:

1. **Scoped Event Bus (`createScopedEventBus`):**
   - Tracks all listeners registered via `.on()` and `.once()`.
   - On unload, `scopedBus.cleanup()` unbinds every listener from the global `CampusEventBus`.
2. **Scoped Registry (`createScopedRegistry`):**
   - Tracks all services, resolvers, context resolvers, stat providers, settings schemas, and permissions registered by that plugin.
   - On unload, `scopedRegistry.cleanup()` automatically unregisters them from `ModuleRegistry` and `PermissionRegistry`.
3. **Scoped Timers (`scopedRegistry.timers`):**
   - Provides tracked timer wrappers:
     ```javascript
     const timer = registry.timers.setInterval(syncTask, 10000);
     ```
   - On unload, `timers.clearAll()` guarantees that any interval or timeout started by the plugin is cancelled immediately.

### 4. Admin API Integration

In `plugins/plugin-manager/backend/src/service/plugin.service.js`, `togglePlugin(pluginName, enabled)` connects directly to the lifecycle unloader:

- When `enabled === false`: `unloadPlugin(pluginName)` is invoked before updating the database.
- Plugin memory is reclaimed immediately without requiring a full server process restart.

## Consequences

### Positive

- **Zero Memory Leaks:** Background timers and persistent listeners are reclaimed deterministically upon plugin deactivation.
- **Fail-Safe Operation:** Hanging `destroy()` hooks cannot freeze the server event loop.
- **Dependency Guard:** Dependent plugins are protected from having critical underlying services pulled out from under them.
- **High Observability:** The `plugin:unloaded` event informs dependent core systems and UI clients in real time.

### Negative / Trade-offs

- Plugin authors must manage state cleanup in their `destroy()` hook if they allocate resources outside host abstractions (e.g. raw TCP handles).

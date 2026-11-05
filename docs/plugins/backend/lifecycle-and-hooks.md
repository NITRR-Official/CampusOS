# Plugin Lifecycle & Teardown Hooks

CampusOS plugins follow a deterministic lifecycle managed by the core runtime bootloader (`backend/src/plugin-loader.js`). This guide explains how plugins initialize resources, implement teardown hooks, and leverage scoped host utilities to guarantee zero memory leaks when disabled.

---

## 1. Lifecycle Overview

A CampusOS backend plugin entrypoint (`backend/src/index.js` or `backend/plugin.js`) can export two lifecycle functions:

| Lifecycle Hook                             | Status       | Description                                                                                   |
| :----------------------------------------- | :----------- | :-------------------------------------------------------------------------------------------- |
| `init(app, registry, eventBus, logger)`    | **Required** | Executed during server bootstrap to mount routes, register services, and subscribe to events. |
| `destroy(app, registry, eventBus, logger)` | **Optional** | Executed when an administrator disables the plugin or triggers dynamic unload at runtime.     |

> [!NOTE]
> `teardown` is supported as an alias for `destroy`.

```javascript
// backend/src/index.js

let activeSocket = null;

export async function init(app, registry, eventBus, logger) {
  logger.info('Initializing biometric sync plugin...');

  // 1. Mount routes
  app.use('/api/v1/biometric', biometricRouter);

  // 2. Register service
  registry.registerService('biometric:service', biometricService);

  // 3. Start tracked background timer
  registry.timers.setInterval(syncAttendanceLogs, 30000);

  // 4. Open external device connection
  activeSocket = connectToTerminalSocket();
}

export async function destroy(app, registry, eventBus, logger) {
  logger.info('Tearing down biometric sync plugin...');

  // Clean up non-host connections
  if (activeSocket) {
    activeSocket.destroy();
    activeSocket = null;
  }
}
```

---

## 2. Scoped Resource Tracking

When writing a plugin, you do not need to manually unbind EventBus listeners or unregister services during `destroy()`. The host runtime automatically tracks:

### A. Automatic Event Listener Cleanup

Any listener registered via `eventBus.on()` or `eventBus.once()` is tracked in the plugin's scoped proxy. When the plugin is unloaded:

- The host automatically removes all listeners registered by this plugin from the global `CampusEventBus`.
- Other plugins listening to the same events are completely unaffected.

### B. Automatic Service & Permission Pruning

- All services registered via `registry.registerService('pluginName:*', service)` are unregistered.
- Context resolvers, stat providers, and settings schemas are removed.
- Permissions registered via `registry.permissions.register()` are deleted.

### C. Scoped Timers (`registry.timers`)

Never use bare Node.js `setInterval` or `setTimeout` directly without tracking! If a plugin is disabled, untracked timers continue running in background memory.

Use `registry.timers`:

```javascript
// Scoped interval (auto-tracked)
const syncTimer = registry.timers.setInterval(() => {
  logger.debug('Running background task');
}, 60000);

// You can clear it manually if needed:
registry.timers.clearInterval(syncTimer);

// Or let CampusOS automatically clear all active timers upon plugin unload!
```

---

## 3. The `destroy()` Hook Guidelines

When implementing `destroy()`, follow these best practices:

1. **Clean Up External Handles:** Close database connection pools, TCP/UDP sockets, worker threads, and child processes.
2. **Be Fast:** The host enforces a **5,000ms safety timeout** on `destroy()`. If your hook exceeds 5 seconds or hangs, the host logs a warning and proceeds with memory cleanup.
3. **Handle Errors Gracefully:** Wrap potentially throwing operations in `try/catch`. The host catches any error thrown in `destroy()` to guarantee that remaining host resources are still cleaned up.

---

## 4. Subscribing to Unload Events

Other plugins can observe when a plugin is unloaded by subscribing to the core lifecycle event:

```javascript
eventBus.on('plugin:unloaded', ({ pluginName, timestamp }) => {
  logger.info(`Detected unload of plugin: ${pluginName} at ${timestamp}`);
  // Invalidate cached references or adjust fallbacks
});
```

---

## 5. Architectural References

- **ADR-019**: [Plugin Lifecycle Teardown & Resource Cleanup](../../architecture/decisions/ADR-019-PLUGIN_LIFECYCLE_TEARDOWN.md)
- **ADR-017**: [Two-Tier Plugin Sandboxing](../../architecture/decisions/ADR-017-TWO_TIER_PLUGIN_SANDBOXING.md)
- **Plugin Contract Specification**: [`shared/src/plugin-contract.js`](file:///shared/src/plugin-contract.js)

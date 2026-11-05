# ADR-015: Central Scoped Logger and Plugin-Level Structured Logging

## Status

Proposed (Accepted for Implementation)

## Context

In earlier phases of CampusOS, logging was divided between:

1. An Express HTTP access logger (`backend/src/middleware/logger.js`) that logged incoming requests on completion.
2. Direct, unmanaged `console.log()` and `console.error()` statements scattered across plugins (`plugins/vendor`, `plugins/club`, `plugins/activity`, `plugins/recruitment`).

This introduced significant operational challenges in production:

1. **Missing Log Levels:** No mechanism to filter logs (e.g., turning off verbose `debug` logs in production or filtering by `LOG_LEVEL`).
2. **Context Loss & Traceability:** Logs emitted from services, background tasks, or event listeners lacked metadata indicating which plugin generated them or what `requestId` was active.
3. **Log Aggregator Incompatibility:** Unstructured plain text logs cannot be parsed or indexed effectively in modern observability platforms (e.g., Datadog, Grafana Loki, AWS CloudWatch, ELK).

## Decision

We will implement a **Centralized Structured Logger Engine** with scoped child logger inheritance:

1. **Structured `Logger` Engine (`backend/src/core/logger.js`):**
   - Provide a lightweight, zero-dependency structured JSON logger supporting standard levels (`debug`, `info`, `warn`, `error`).
   - Support dynamic log-level filtering via `process.env.LOG_LEVEL` (defaulting to `info` in production, `debug` in development).
   - Implement `.child(context)` to create child loggers that inherit parent metadata with automatic merging.
2. **Plugin Scoped Logger Injection (`backend/src/plugin-loader.js`):**
   - The plugin bootloader will instantiate `rootLogger.child({ plugin: plugin.name })` and inject it as the 4th parameter to plugin entry points: `init(app, registry, eventBus, logger)`.
   - The root logger will be registered into `ModuleRegistry` as `core:logger` for global access (`registry.getService('core:logger')`).
3. **Request-Scoped HTTP Logging:**
   - `loggerMiddleware` attaches a request-scoped logger to `req.logger` containing `{ requestId, userId, ip }`, enabling controllers to emit contextual logs effortlessly.
4. **Backward Compatibility:**
   - Plugins receiving only `(app, registry, eventBus)` will continue functioning without modification.

## Rationale

1. **Observability Standards:** JSON-structured logs with consistent keys (`timestamp`, `level`, `plugin`, `requestId`, `message`) enable automated ingestion and alerting.
2. **Zero External Dependency:** A clean, optimized in-house logger avoids heavy logging framework overhead while fulfilling 100% of the platform's requirements.
3. **Encapsulated Scope:** Plugins automatically tag their logs without having to manually pass plugin names or metadata on every call.

## Consequences

### Positive

- Unified, production-grade JSON logging across core Express, all plugins, and background listeners.
- Dynamic log level filtering reduces noise and storage costs in production.
- Traceability across the lifecycle of every request and plugin execution.

### Negative

- Existing plugins using `console.log` will need to be progressively migrated to `logger.info()`.

## Related ADRs

- [ADR-003: System Layers](./ADR-003-SYSTEM_LAYERS.md)
- [ADR-006: Plugin Manager Config & Restart Pattern](./ADR-006-PLUGIN_MANAGER_RESTART.md)

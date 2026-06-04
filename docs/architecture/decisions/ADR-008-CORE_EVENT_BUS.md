# ADR 008: Core Event Bus (EventEmitter)

## Status

Accepted

## Context

As the plugin ecosystem for CampusOS expands, we face the classic architectural challenge of **module coupling**. For example, when a new `Event` is created, the `Budget` plugin might need to allocate a draft budget, or the `Scheduling` plugin might need to verify venue availability.

If the `Event` plugin directly imports and calls functions from the `Budget` and `Scheduling` plugins, we create a monolithic hairball of dependencies. If a university installs the `Event` plugin but uninstalls the `Budget` plugin, the `Event` plugin would crash due to missing dependencies.

We evaluated several event-driven architectures:
1. **External Message Broker (RabbitMQ, Kafka)**: Highly scalable but adds immense infrastructure overhead. Unnecessary since all our plugins run in the same Node.js process.
2. **In-Memory Redis Pub/Sub**: Good for multi-instance scaling, but adds a Redis dependency which violates our goal of a simple, easy-to-deploy open-source architecture for universities.
3. **Node.js Native `EventEmitter`**: Zero dependencies, runs in memory within the current process, extremely fast, and perfectly fits our single-process plugin loader model.

## Decision

**Adopt Node.js native `EventEmitter` as the central Event Bus.**

A singleton instance of `EventEmitter` (`backend/src/core/event-bus.js`) is instantiated by the core framework. 
The `PluginLoader` will inject this `eventBus` instance into every plugin's `init()` function as the third argument:
```javascript
export async function init(app, registry, eventBus) { ... }
```

### Event Payload Conventions (Security)
To ensure security and prevent data leaks across third-party plugins:
1. **Never emit sensitive data or PII** (e.g., passwords, emails, financial tokens).
2. **Emit Identifiers**: Only emit the `_id` of the document and non-sensitive metadata (e.g., `{ eventId: '123', action: 'created' }`).
3. If a listening plugin requires the full document, it must query the database itself, which ensures standard access controls are applied.

### Naming Conventions
Events must follow the `<domain>:<action>` format.
- `event:created`
- `user:registered`
- `club:approved`

## Rationale

- **Zero Overhead**: Using `events.EventEmitter` adds absolutely zero latency or infrastructure overhead compared to a TCP-based broker.
- **Decoupling**: Plugins can safely publish events without caring if anyone is listening, preventing crash-loops if optional plugins are uninstalled.
- **Simplicity**: It keeps the barrier to entry extremely low for open-source contributors wanting to build third-party plugins.

## Consequences

### Positive
- Perfect horizontal decoupling between plugin domains.
- Extremely fast execution (in-memory).

### Negative
- If CampusOS scales to a multi-instance microservice deployment (e.g., Kubernetes with 5 backend pods), an in-memory `EventEmitter` will not broadcast events across the network to other pods. If that day comes, we will easily swap the `EventEmitter` instance out for an interface that wraps Redis or RabbitMQ without having to change the plugin code (since the `.emit()` and `.on()` signature is identical).

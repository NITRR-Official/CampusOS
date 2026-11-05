# ADR-016: Polyglot Database Architecture and Multi-Store Adapters

## Status

Accepted (Implemented in PR #116)

## Context

Prior to this architecture decision, CampusOS database connectivity was centralized in a single Mongoose connection file (`backend/src/database/connection.js`). This presented several architectural limitations:

1. **Violation of Open-Closed Principle (OCP):** Adding support for another database engine (such as PostgreSQL or SQLite) required modifying core connection files rather than extending an adapter interface.
2. **Violation of Dependency Inversion Principle (DIP):** Core Express server bootstrap and plugin context resolvers directly imported Mongoose models, coupling the application layers to MongoDB.
3. **Enterprise SQL Requirements:** Certain enterprise domains (such as budget accounting, financial transactions, and immutable audit ledgers) require strict relational integrity, foreign key constraints, and ACID transactions best served by SQL (PostgreSQL). Other domains (clubs, activity feeds, forms) benefit from MongoDB's flexible document schema.

## Decision

We have decoupled the database layer into an extensible **Polyglot Database Architecture**:

1. **Abstract `DatabaseAdapter` Contract (`backend/src/database/adapters/base.adapter.js`):**
   - Defines standard lifecycle and health methods: `connect(config)`, `disconnect()`, `healthCheck()`, `isHealthy()`, and `getClient()`.
2. **Concrete Engine Adapters:**
   - `MongoAdapter`: Manages Mongoose connection pools, replica set event monitoring, and reconnection logic.
   - `SqlAdapter`: Manages Knex.js / PostgreSQL connection pooling and ping health checks.
3. **Unified `DatabaseManager` (`backend/src/database/database-manager.js`):**
   - Orchestrates multi-store registration, concurrent parallel startup (`connectAll()`), and graceful shutdown (`disconnectAll()`).
   - Injects database instances into `ModuleRegistry` during boot:
     - `db:mongo` → MongoAdapter instance
     - `db:sql` → SqlAdapter instance
     - `db:manager` → DatabaseManager instance
4. **Backward-Compatible Facade (`backend/src/database/connection.js`):**
   - Delegates `connectDB()`, `disconnectDB()`, and `isDBConnected()` to `DatabaseManager`, ensuring 100% backward compatibility with existing tests and scripts without breaking changes.
5. **Enforce Repository Decoupling:**
   - All plugins access data persistence strictly via `Repository` classes, eliminating direct Mongoose schema imports in route context resolvers.

## Rationale

1. **Pluggable & Extensible:** Third-party plugins can declare SQL or NoSQL database requirements and retrieve the appropriate database client from `ServiceRegistry`.
2. **Resilience & Graceful Teardown:** Centralized connection pooling and unified health checks allow `/health` to report granular per-store status and guarantee zero connection leaks during process termination.
3. **Decoupled Cross-Store Boundaries:** Domain events emitted on `CampusEventBus` replace cross-database foreign keys, maintaining loose coupling across plugins.

## Consequences

### Positive

- Full polyglot support: plugins can utilize PostgreSQL, MongoDB, or both according to domain needs.
- OCP and DIP architectural compliance verified with 14 unit tests in Vitest.
- Zero breaking changes to existing plugin test suites or scripts.

### Negative

- Distributed transactions across Mongo and Postgres require eventual consistency through domain events rather than single-database atomic transactions.

## Related ADRs

- [ADR-001: Tech Stack Selection](./ADR-001-TECH_STACK.md)
- [ADR-013: Factory Pattern Services and Dependency Inversion](./ADR-013-FACTORY_PATTERN_SERVICES.md)

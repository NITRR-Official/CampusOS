# ADR-021: Automated Plugin Database Schema Migrations Engine

## Status

Accepted

## Context

In ADR-016, CampusOS introduced a polyglot database adapter layer supporting MongoDB and relational engines. However, as plugins evolve across releases (e.g. `v1.0.0` to `v2.0.0`) or when new plugins are installed, database schemas require structured evolution:

1. **Schema Drift & Corruption:** Without a standardized migrations system, plugins attempted to create indexes or backfill data inside `init()` using ad-hoc queries, leading to race conditions during multi-instance startup.
2. **Missing Rollback Safety:** If a plugin update encountered a DDL error or data transformation failure midway, the database was left in an inconsistent intermediate state.
3. **No Migration Audit Trail:** CampusOS administrators and developers had no visibility into which schema migrations had been applied, when they ran, or what version of the plugin introduced them.

## Decision

CampusOS implements an automated, version-aware **Plugin Database Migration Runner** (`backend/src/database/migration-runner.js`):

### 1. Dedicated Migration Files & Convention

Each plugin can provide migration scripts inside `plugins/<name>/migrations/`:

- **Naming:** Sequentially ordered files with natural sort (e.g. `001_initial_schema.js`, `002_add_indexes.js`).
- **Contract:** Each migration file exports `up({ db, connection, mongoose, logger, registry })` and optional `down({ db, connection, mongoose, logger, registry })`.
- **Integrity:** SHA-256 checksums are calculated for every migration file to detect tampering or accidental modifications of applied migrations.

### 2. Centralized Audit Collection (`_plugin_migrations`)

All applied migrations are tracked in the database under `_plugin_migrations`:

- Fields: `pluginName`, `migrationName`, `version`, `appliedAt`, `checksum`, `executionTimeMs`.
- Compound unique index: `{ pluginName: 1, migrationName: 1 }` guarantees idempotent application across clusters.

### 3. Lifecycle Integration in `PluginLoader`

During boot and runtime activation (`backend/src/plugin-loader.js`):

- Pending migrations are discovered and applied **before** `plugin.init()` is invoked.
- If a migration fails during `up()`:
  - An automatic rollback is attempted if `down()` is exported.
  - The migration is not marked as applied.
  - A structured `PluginMigrationError` is thrown, halting plugin initialization to prevent corrupt state from serving traffic.

### 4. Rollback and Status Inspection APIs

The engine exposes programmatic APIs:

- `runPendingMigrations(pluginName, pluginPath, options)`
- `rollbackMigration(pluginName, pluginPath, migrationName, options)`
- `getMigrationStatus(pluginName, pluginPath, options)`

## Consequences

### Positive

- **Deterministic Schema Evolution:** Database changes are tracked, sequential, and reproducible across local development, CI/CD, and production.
- **Fail-Fast Integrity:** Faulty migrations prevent plugin activation before any routes or event listeners are registered.
- **Auditable & Reversible:** Administrators can inspect applied migrations and roll back breaking changes cleanly.

### Negative / Trade-Offs

- **Node Dynamic Import Restrictions:** Migration scripts must be valid ES modules (`.js` or `.mjs`) executable in Node.js.
- **Non-Transactional MongoDB Limitations:** MongoDB operations spanning multiple collections require replica sets for multi-document ACID transactions; standalone local instances execute sequential steps.

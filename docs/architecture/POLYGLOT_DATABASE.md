# Polyglot Database Architecture & Plugin Guidelines

## Overview

CampusOS supports both **NoSQL (MongoDB via Mongoose)** and **SQL (PostgreSQL via Knex / pg)** through an extensible **Database Adapter Pattern** orchestrated by `DatabaseManager`.

```
                       [ backend/src/index.js ]
                                  │
                                  ▼
                  [ DatabaseManager (database-manager.js) ]
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
     [ MongoAdapter ]                         [ SqlAdapter ]
   (Mongoose Connection)                   (Knex / pg Client Pool)
               │                                     │
               └──────────────────┬──────────────────┘
                                  │ registers into
                                  ▼
                      [ ModuleRegistry (registry.js) ]
                                  │
               ┌──────────────────┴──────────────────┐
               ▼                                     ▼
     [ Plugins using Mongo ]               [ Plugins using SQL ]
   (forms, events, activity)             (budget, audit, ledger)
               │                                     │
               ▼                                     ▼
   [ Mongo Repositories ]                 [ SQL Repositories ]
```

---

## 1. Adapter Contract (`DatabaseAdapter`)

All database engines implement the standard `DatabaseAdapter` interface defined in `backend/src/database/adapters/base.adapter.js`:

```javascript
export class DatabaseAdapter {
  async connect(config = {}) { ... }
  async disconnect() { ... }
  isConnected() { ... }
  async healthCheck() { ... }
  getClient() { ... }
}
```

---

## 2. Accessing Database Clients in Plugins

Plugins never import database drivers directly. Instead, they consume managed instances registered in `ModuleRegistry`:

### MongoDB Plugins

Plugins using MongoDB can either define Mongoose models through their Repository or retrieve the Mongoose instance:

```javascript
export async function init(app, registry) {
  const mongoose = registry.getService('db:mongo');
}
```

### SQL (PostgreSQL) Plugins

Plugins using SQL retrieve the managed connection pool:

```javascript
export async function init(app, registry) {
  const sql = registry.getService('db:sql');
  const pool = sql.getClient();

  // Pass pool into repository factory
  const repository = createSqlRepository(pool);
}
```

---

## 3. Polyglot Plugin Development Rules

1. **Declare Database Requirement in `plugin.json`:**
   ```json
   {
     "name": "audit-ledger",
     "version": "1.0.0",
     "database": {
       "type": "sql"
     }
   }
   ```
2. **Strict Repository Layering:**
   - Database operations (queries, updates, transactions) must live exclusively in `repository/`.
   - Controllers and services must **never** execute raw database queries or import schemas directly.
3. **Context Resolvers Must Use Repositories:**
   - In dynamic context resolvers (e.g. `registry.registerContextResolver('/api/v1/...')`), always query via the repository (e.g., `await repo.findById(id)`).
   - Never use dynamic `await import('./schema/...')` in request paths.
4. **Cross-Plugin Relationships (No Cross-DB JOINs):**
   - References across plugins must be stored as strings (String UUIDs or ObjectIds).
   - Do not perform cross-database `$lookup` or SQL `JOIN`s.
   - Use the `CampusEventBus` to notify other modules of entity lifecycle events (`entity:created`, `entity:deleted`).

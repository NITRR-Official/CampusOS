# Plugin Database Schema Migrations

CampusOS provides an automated, version-aware **Database Migration Runner** (ADR-021) that executes schema updates before a plugin is activated.

This guarantees that collections, indexes, and initial reference documents exist prior to `init()` receiving incoming API requests.

---

## 1. Directory Structure & File Naming

Place migration scripts in the plugin's `migrations/` directory:

```
plugins/my-plugin/
├── backend/
│   └── src/
│       └── index.js
├── migrations/
│   ├── 001_initial_collections.js
│   ├── 002_add_search_index.js
│   └── 003_backfill_default_status.js
├── frontend/
└── plugin.json
```

### Naming Conventions

- Prefix filenames with sequential numbers: `001_`, `002_`, `003_`.
- Use descriptive names: `001_create_applications_table.js`.
- The engine uses natural alphanumeric sorting to guarantee execution order.

---

## 2. Migration Contract (`up` and `down`)

Every migration file must export an asynchronous `up` function, and should export an optional `down` function for rollback support:

```javascript
/**
 * Forward migration: creates indexes and initial collections
 */
export async function up({ db, connection, mongoose, logger, registry }) {
  logger.info('Creating indexes for club applications collection...');

  const collection = db.collection('club_applications');

  // Create compound index for fast lookups
  await collection.createIndex(
    { clubId: 1, status: 1 },
    { name: 'idx_club_status' }
  );

  // Create unique index for preventing duplicate student applications
  await collection.createIndex(
    { clubId: 1, studentId: 1 },
    { unique: true, name: 'uniq_club_student' }
  );

  logger.info('Indexes created successfully.');
}

/**
 * Rollback migration: drops created indexes or reverts modifications
 */
export async function down({ db, connection, mongoose, logger, registry }) {
  logger.info('Rolling back club applications indexes...');

  const collection = db.collection('club_applications');
  await collection.dropIndex('uniq_club_student');
  await collection.dropIndex('idx_club_status');

  logger.info('Rollback complete.');
}
```

### Context Parameters

The migration context supplies:

| Parameter    | Type                  | Description                           |
| ------------ | --------------------- | ------------------------------------- |
| `db`         | `mongodb.Db`          | Native MongoDB database instance      |
| `connection` | `mongoose.Connection` | Active Mongoose database connection   |
| `mongoose`   | `typeof mongoose`     | Mongoose library export               |
| `logger`     | `Logger`              | Scoped logger instance for the plugin |
| `registry`   | `PluginRegistry`      | Service registry instance             |

---

## 3. How Migrations Run

During platform startup or plugin runtime activation:

1. **Discovery:** `MigrationRunner` scans `plugins/<name>/migrations/` for valid `.js` files.
2. **Audit Check:** Queries the central `_plugin_migrations` collection to identify which scripts have already executed.
3. **Execution:** Pending migrations run sequentially in ascending order.
4. **Recording:** Successful executions are recorded in `_plugin_migrations` with checksum, timestamp, and duration:
   ```json
   {
     "pluginName": "recruitment",
     "migrationName": "001_initial_collections.js",
     "version": "1.0.0",
     "checksum": "d41d8cd98f00b204e9800998ecf8427e...",
     "appliedAt": "2026-11-05T19:30:00.000Z",
     "executionTimeMs": 42
   }
   ```
5. **Rollback on Failure:** If `up()` throws an exception, the engine attempts `down()` if provided, aborts loading the plugin, and raises `PluginMigrationError`.

---

## 4. Best Practices

- **Idempotency:** Write migrations to be safe if rerun (e.g. check if an index or field exists before modifying).
- **Non-blocking Operations:** For large collections with millions of documents, avoid full table re-writes in a single migration step; batch updates in chunks.
- **Never Modify Applied Migrations:** Once a migration has run in production, never edit its code. Create a new sequential migration script (e.g. `004_fix_index.js`) instead.

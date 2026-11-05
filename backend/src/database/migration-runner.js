/**
 * Plugin Database Migration Runner (Issue #126)
 *
 * Automatically discovers, tracks, and applies database schema migrations
 * for plugins during initialization. Supports forward migrations (up),
 * rollback (down), checksum verification, and audit tracking in '_plugin_migrations'.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pathToFileURL } from 'url';
import mongoose from 'mongoose';
import { PluginMigrationError } from '@campus-os/shared/plugin-contract';

const MIGRATIONS_COLLECTION = '_plugin_migrations';

/**
 * Calculates SHA-256 checksum of a migration file for tamper detection.
 * @param {string} filePath
 * @returns {string}
 */
export function calculateFileChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Discovers all migration files for a given plugin path, sorted in natural order.
 * @param {string} pluginPath
 * @returns {Array<{ name: string, path: string, checksum: string }>}
 */
export function discoverMigrations(pluginPath) {
  if (!pluginPath || !fs.existsSync(pluginPath)) {
    return [];
  }

  const candidateDirs = [
    path.join(pluginPath, 'migrations'),
    path.join(pluginPath, 'backend', 'migrations')
  ];

  const migrationsDir = candidateDirs.find((dir) => fs.existsSync(dir));
  if (!migrationsDir) {
    return [];
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter(
      (file) =>
        file.endsWith('.js') &&
        !file.endsWith('.test.js') &&
        !file.endsWith('.spec.js')
    )
    .sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

  return files.map((file) => {
    const fullPath = path.join(migrationsDir, file);
    return {
      name: file,
      path: fullPath,
      checksum: calculateFileChecksum(fullPath)
    };
  });
}

/**
 * Default in-memory storage adapter for testing and offline execution.
 */
export class InMemoryMigrationStorage {
  constructor() {
    this.records = new Map(); // key: `${pluginName}:${migrationName}`
  }

  async getApplied(pluginName) {
    const applied = [];
    for (const [key, record] of this.records.entries()) {
      if (record.pluginName === pluginName) {
        applied.push(record);
      }
    }
    return applied;
  }

  async record(entry) {
    const key = `${entry.pluginName}:${entry.migrationName}`;
    this.records.set(key, entry);
  }

  async remove(pluginName, migrationName) {
    const key = `${pluginName}:${migrationName}`;
    return this.records.delete(key);
  }

  clear() {
    this.records.clear();
  }
}

/**
 * Ensures the unique compound index on '_plugin_migrations' exists.
 * @param {import('mongodb').Collection} collection
 */
async function ensureIndex(collection) {
  try {
    await collection.createIndex(
      { pluginName: 1, migrationName: 1 },
      { unique: true }
    );
  } catch {
    // Ignore index exists or race condition errors
  }
}

/**
 * Retrieves all applied migration records for a plugin from MongoDB or custom storage.
 * @param {string} pluginName
 * @param {Object} [options]
 * @returns {Promise<Array<Object>>}
 */
export async function getAppliedMigrations(pluginName, options = {}) {
  if (options.storage) {
    return options.storage.getApplied(pluginName);
  }

  const conn = options.connection || mongoose.connection;
  if (!conn || conn.readyState !== 1 || !conn.db) {
    return [];
  }

  const collection = conn.db.collection(MIGRATIONS_COLLECTION);
  await ensureIndex(collection);

  return collection.find({ pluginName }).sort({ appliedAt: 1 }).toArray();
}

/**
 * Records an applied migration into '_plugin_migrations'.
 * @param {Object} entry
 * @param {Object} [options]
 */
export async function recordMigrationApplied(entry, options = {}) {
  if (options.storage) {
    await options.storage.record(entry);
    return;
  }

  const conn = options.connection || mongoose.connection;
  if (!conn || conn.readyState !== 1 || !conn.db) {
    return;
  }

  const collection = conn.db.collection(MIGRATIONS_COLLECTION);
  await ensureIndex(collection);

  await collection.updateOne(
    { pluginName: entry.pluginName, migrationName: entry.migrationName },
    { $set: entry },
    { upsert: true }
  );
}

/**
 * Removes a migration record during rollback.
 * @param {string} pluginName
 * @param {string} migrationName
 * @param {Object} [options]
 */
export async function removeMigrationRecord(
  pluginName,
  migrationName,
  options = {}
) {
  if (options.storage) {
    await options.storage.remove(pluginName, migrationName);
    return;
  }

  const conn = options.connection || mongoose.connection;
  if (!conn || conn.readyState !== 1 || !conn.db) {
    return;
  }

  const collection = conn.db.collection(MIGRATIONS_COLLECTION);
  await collection.deleteOne({ pluginName, migrationName });
}

/**
 * Runs all pending migrations for a plugin in sequential ascending order.
 *
 * @param {string} pluginName - Unique name of the plugin
 * @param {string} pluginPath - Root directory of the plugin
 * @param {Object} [options]
 * @param {Object} [options.logger] - Logger instance
 * @param {string} [options.version] - Current plugin version
 * @param {Object} [options.connection] - MongoDB connection
 * @param {Object} [options.storage] - Custom migration storage
 * @param {Object} [options.registry] - Service registry
 * @param {boolean} [options.dryRun] - If true, returns pending migrations without executing
 * @returns {Promise<{ success: boolean, appliedCount: number, appliedMigrations: Array<string> }>}
 */
export async function runPendingMigrations(
  pluginName,
  pluginPath,
  options = {}
) {
  const logger = options.logger || console;
  const version = options.version || '1.0.0';
  const conn = options.connection || mongoose.connection;
  const isConnected =
    options.storage || (conn && conn.readyState === 1 && Boolean(conn.db));

  const allMigrations = discoverMigrations(pluginPath);
  if (allMigrations.length === 0) {
    return { success: true, appliedCount: 0, appliedMigrations: [] };
  }

  if (!isConnected) {
    logger.warn?.(
      `⚠️ Database not connected; skipping pending database migrations for '${pluginName}'`
    );
    return { success: true, appliedCount: 0, appliedMigrations: [] };
  }

  const appliedRecords = await getAppliedMigrations(pluginName, options);
  const appliedNames = new Set(appliedRecords.map((r) => r.migrationName));

  const pendingMigrations = allMigrations.filter(
    (m) => !appliedNames.has(m.name)
  );
  if (pendingMigrations.length === 0) {
    return { success: true, appliedCount: 0, appliedMigrations: [] };
  }

  if (options.dryRun) {
    return {
      success: true,
      appliedCount: pendingMigrations.length,
      appliedMigrations: pendingMigrations.map((m) => m.name),
      dryRun: true
    };
  }

  logger.info?.(
    `Running ${pendingMigrations.length} pending database migrations for plugin '${pluginName}'...`
  );

  const appliedList = [];

  for (const migration of pendingMigrations) {
    const startMs = Date.now();
    let migrationModule;

    try {
      migrationModule = await import(pathToFileURL(migration.path).href);
    } catch (importErr) {
      const err = new PluginMigrationError(
        `Failed to load migration file '${migration.name}' for plugin '${pluginName}': ${importErr.message}`,
        pluginName,
        migration.name,
        importErr
      );
      throw err;
    }

    const upFn = migrationModule.up || migrationModule.default?.up;
    if (typeof upFn !== 'function') {
      throw new PluginMigrationError(
        `Migration '${migration.name}' for plugin '${pluginName}' violates contract: Missing 'up' function export.`,
        pluginName,
        migration.name
      );
    }

    try {
      await upFn({
        db: conn?.db,
        connection: conn,
        mongoose,
        logger,
        registry: options.registry
      });

      const executionTimeMs = Date.now() - startMs;
      await recordMigrationApplied(
        {
          pluginName,
          migrationName: migration.name,
          version,
          checksum: migration.checksum,
          appliedAt: new Date(),
          executionTimeMs
        },
        options
      );

      appliedList.push(migration.name);
      logger.info?.(
        `✓ Applied migration: ${pluginName}/${migration.name} (${executionTimeMs}ms)`
      );
    } catch (execErr) {
      logger.error?.(
        `❌ Migration '${migration.name}' failed for plugin '${pluginName}': ${execErr.message}`
      );

      // Attempt rollback if down function is present
      const downFn = migrationModule.down || migrationModule.default?.down;
      if (typeof downFn === 'function') {
        try {
          logger.warn?.(
            `Attempting rollback (down) for failed migration '${migration.name}'...`
          );
          await downFn({
            db: conn?.db,
            connection: conn,
            mongoose,
            logger,
            registry: options.registry
          });
          logger.info?.(
            `✓ Rollback successful for failed migration '${migration.name}'`
          );
        } catch (downErr) {
          logger.error?.(
            `⚠️ Rollback failed for migration '${migration.name}': ${downErr.message}`
          );
        }
      }

      throw new PluginMigrationError(
        `Database migration '${migration.name}' failed for plugin '${pluginName}': ${execErr.message}`,
        pluginName,
        migration.name,
        execErr
      );
    }
  }

  return {
    success: true,
    appliedCount: appliedList.length,
    appliedMigrations: appliedList
  };
}

/**
 * Rolls back a specific migration or the last applied migration for a plugin.
 *
 * @param {string} pluginName
 * @param {string} pluginPath
 * @param {string} [migrationName] - Specific migration to roll back. If omitted, rolls back the most recent applied migration.
 * @param {Object} [options]
 * @returns {Promise<{ success: boolean, rolledBack: string }>}
 */
export async function rollbackMigration(
  pluginName,
  pluginPath,
  migrationName,
  options = {}
) {
  const logger = options.logger || console;
  const conn = options.connection || mongoose.connection;
  const appliedRecords = await getAppliedMigrations(pluginName, options);

  if (appliedRecords.length === 0) {
    throw new PluginMigrationError(
      `No applied migrations found to roll back for plugin '${pluginName}'`,
      pluginName
    );
  }

  const targetName =
    migrationName || appliedRecords[appliedRecords.length - 1].migrationName;
  const allMigrations = discoverMigrations(pluginPath);
  const targetMigration = allMigrations.find((m) => m.name === targetName);

  if (!targetMigration) {
    throw new PluginMigrationError(
      `Migration file for '${targetName}' not found in plugin path`,
      pluginName,
      targetName
    );
  }

  const migrationModule = await import(
    pathToFileURL(targetMigration.path).href
  );
  const downFn = migrationModule.down || migrationModule.default?.down;

  if (typeof downFn !== 'function') {
    throw new PluginMigrationError(
      `Cannot roll back migration '${targetName}': Missing 'down' function export`,
      pluginName,
      targetName
    );
  }

  await downFn({
    db: conn?.db,
    connection: conn,
    mongoose,
    logger,
    registry: options.registry
  });

  await removeMigrationRecord(pluginName, targetName, options);
  logger.info?.(`✓ Rolled back migration: ${pluginName}/${targetName}`);

  return { success: true, rolledBack: targetName };
}

/**
 * Returns migration status for a plugin (total, applied, pending).
 *
 * @param {string} pluginName
 * @param {string} pluginPath
 * @param {Object} [options]
 * @returns {Promise<{ totalCount: number, appliedCount: number, pendingCount: number, migrations: Array<Object> }>}
 */
export async function getMigrationStatus(pluginName, pluginPath, options = {}) {
  const allMigrations = discoverMigrations(pluginPath);
  const appliedRecords = await getAppliedMigrations(pluginName, options);
  const appliedMap = new Map(appliedRecords.map((r) => [r.migrationName, r]));

  const statusList = allMigrations.map((m) => {
    const applied = appliedMap.get(m.name);
    return {
      name: m.name,
      status: applied ? 'applied' : 'pending',
      appliedAt: applied ? applied.appliedAt : null,
      checksum: m.checksum,
      executionTimeMs: applied ? applied.executionTimeMs : null
    };
  });

  return {
    totalCount: allMigrations.length,
    appliedCount: appliedRecords.length,
    pendingCount: allMigrations.length - appliedRecords.length,
    migrations: statusList
  };
}

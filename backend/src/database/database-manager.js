/**
 * Database Manager
 * Orchestrates multi-database adapters (MongoDB, PostgreSQL, etc.),
 * lifecycle management (concurrent startup, shutdown), health aggregation,
 * and service registry injection.
 */

import { MongoAdapter } from './adapters/mongo.adapter.js';
import { SqlAdapter } from './adapters/sql.adapter.js';

export class DatabaseManager {
  #adapters = new Map();

  constructor() {
    this.registerAdapter('mongo', new MongoAdapter());
    this.registerAdapter('sql', new SqlAdapter());
  }

  /**
   * Register a database adapter
   * @param {string} name - e.g. 'mongo', 'sql'
   * @param {import('./adapters/base.adapter.js').DatabaseAdapter} adapter
   */
  registerAdapter(name, adapter) {
    if (!name || typeof name !== 'string') {
      throw new Error('Adapter name must be a non-empty string');
    }
    this.#adapters.set(name.toLowerCase(), adapter);
  }

  /**
   * Get an adapter by name
   * @param {string} name
   * @returns {import('./adapters/base.adapter.js').DatabaseAdapter | undefined}
   */
  getAdapter(name) {
    return this.#adapters.get(name.toLowerCase());
  }

  /**
   * Connect a specific adapter
   * @param {string} name
   * @param {Object} [config]
   * @returns {Promise<boolean>}
   */
  async connect(name, config = {}) {
    const adapter = this.getAdapter(name);
    if (!adapter) {
      throw new Error(`Database adapter '${name}' is not registered`);
    }
    return adapter.connect(config);
  }

  /**
   * Connect all enabled database adapters concurrently
   * @param {Object} [configs] - Map of adapter name to configuration
   * @returns {Promise<{ success: boolean, results: Record<string, any> }>}
   */
  async connectAll(configs = {}) {
    const promises = [];
    const names = [];

    for (const [name, adapter] of this.#adapters.entries()) {
      // Connect mongo by default; for sql, only connect if explicitly enabled or configured
      if (
        name === 'sql' &&
        typeof adapter.isEnabled === 'function' &&
        !adapter.isEnabled() &&
        !configs[name]
      ) {
        continue;
      }
      names.push(name);
      promises.push(adapter.connect(configs[name] || {}));
    }

    const settled = await Promise.allSettled(promises);
    const results = {};
    let allSucceeded = true;

    settled.forEach((result, idx) => {
      const name = names[idx];
      if (result.status === 'fulfilled') {
        results[name] = { success: true };
      } else {
        allSucceeded = false;
        results[name] = { success: false, error: result.reason?.message };
        console.error(
          `❌ Failed to connect database '${name}':`,
          result.reason?.message
        );
      }
    });

    if (!allSucceeded && results.mongo && !results.mongo.success) {
      throw new Error(`Primary database (mongo) failed to connect`);
    }

    return { success: allSucceeded, results };
  }

  /**
   * Disconnect all active database adapters cleanly
   * @returns {Promise<void>}
   */
  async closeAll() {
    const promises = Array.from(this.#adapters.values()).map(
      async (adapter) => {
        try {
          if (adapter.isConnected()) {
            await adapter.disconnect();
          }
        } catch (err) {
          console.error(
            `Error disconnecting adapter '${adapter.name}':`,
            err.message
          );
        }
      }
    );

    await Promise.allSettled(promises);
  }

  /**
   * Check if the primary database (or any adapter) is connected
   * @param {string} [name='mongo']
   * @returns {boolean}
   */
  isConnected(name = 'mongo') {
    const adapter = this.getAdapter(name);
    return adapter ? adapter.isConnected() : false;
  }

  /**
   * Aggregate health checks across all registered database adapters
   * @returns {Promise<{ healthy: boolean, databases: Record<string, any>, timestamp: string }>}
   */
  async getHealth() {
    const healthChecks = {};
    let overallHealthy = true;

    for (const [name, adapter] of this.#adapters.entries()) {
      try {
        const check = await adapter.healthCheck();
        healthChecks[name] = check;
        if (!check.healthy && check.status !== 'disabled') {
          overallHealthy = false;
        }
      } catch (err) {
        healthChecks[name] = { healthy: false, error: err.message };
        overallHealthy = false;
      }
    }

    return {
      healthy: overallHealthy,
      databases: healthChecks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Expose database client services into the central ModuleRegistry
   * @param {Object} registry - CampusOS ModuleRegistry
   */
  registerServices(registry) {
    if (!registry || typeof registry.registerService !== 'function') {
      return;
    }

    const mongoAdapter = this.getAdapter('mongo');
    if (mongoAdapter) {
      registry.registerService('db:mongo', mongoAdapter.getClient());
    }

    const sqlAdapter = this.getAdapter('sql');
    if (sqlAdapter) {
      registry.registerService('db:sql', {
        getClient: () => sqlAdapter.getClient(),
        isConnected: () => sqlAdapter.isConnected(),
        isEnabled: () =>
          typeof sqlAdapter.isEnabled === 'function'
            ? sqlAdapter.isEnabled()
            : false
      });
    }

    registry.registerService('db:manager', this);
    console.log(
      '✓ Database services registered in ServiceRegistry (db:mongo, db:sql, db:manager)'
    );
  }
}

export const databaseManager = new DatabaseManager();
export default databaseManager;

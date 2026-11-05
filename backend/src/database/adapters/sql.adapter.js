/**
 * SQL Database Adapter (PostgreSQL / Knex / pg)
 * Implements DatabaseAdapter interface for relational databases.
 */

import { DatabaseAdapter } from './base.adapter.js';

export class SqlAdapter extends DatabaseAdapter {
  #client = null;
  #connected = false;
  #enabled = false;
  #connectionUrl = null;

  constructor() {
    super('sql');
    this.#connectionUrl =
      process.env.SQL_DATABASE_URL ||
      process.env.DATABASE_URL ||
      process.env.PG_URI ||
      null;
    this.#enabled = Boolean(this.#connectionUrl);
  }

  /**
   * Check if SQL adapter is configured via environment
   * @returns {boolean}
   */
  isEnabled() {
    return this.#enabled;
  }

  /**
   * Connect to SQL database pool
   * @param {Object} [config]
   * @returns {Promise<boolean>}
   */
  async connect(config = {}) {
    const url = config.uri || this.#connectionUrl;
    if (!url) {
      this.#enabled = false;
      return false;
    }

    this.#enabled = true;
    this.#connectionUrl = url;

    try {
      // Dynamic import to avoid hard crashes if optional SQL dependencies are not installed
      let pgModule;
      try {
        pgModule = await import('pg');
      } catch {
        try {
          pgModule = await import('knex');
        } catch {
          console.warn(
            '⚠️ SQL database URL is configured, but neither "pg" nor "knex" is installed. SQL adapter disabled.'
          );
          this.#enabled = false;
          return false;
        }
      }

      if (pgModule.Pool || pgModule.default?.Pool) {
        const Pool = pgModule.Pool || pgModule.default.Pool;
        this.#client = new Pool({
          connectionString: url,
          max: config.maxPoolSize || 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
        });

        // Test connection
        await this.#client.query('SELECT 1');
        this.#connected = true;
        console.log('✅ SQL Database (PostgreSQL) connected successfully');
        return true;
      }

      this.#connected = true;
      return true;
    } catch (error) {
      this.#connected = false;
      console.error('❌ SQL Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Close SQL connection pool
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this.#client) {
      this.#connected = false;
      return;
    }

    try {
      if (typeof this.#client.end === 'function') {
        await this.#client.end();
      } else if (typeof this.#client.destroy === 'function') {
        await this.#client.destroy();
      }
      this.#client = null;
      this.#connected = false;
      console.log('✅ SQL Database pool closed');
    } catch (error) {
      console.error('❌ SQL Database disconnect error:', error.message);
      throw error;
    }
  }

  /**
   * Check connection status
   * @returns {boolean}
   */
  isConnected() {
    return this.#enabled && this.#connected;
  }

  /**
   * Ping database and measure query latency
   * @returns {Promise<{ healthy: boolean, status: string, latencyMs?: number, error?: string }>}
   */
  async healthCheck() {
    if (!this.#enabled) {
      return {
        healthy: true,
        status: 'disabled',
        message: 'SQL adapter is not configured'
      };
    }

    if (!this.#client) {
      return {
        healthy: false,
        status: 'disconnected',
        error: 'SQL client not initialized'
      };
    }

    const start = Date.now();
    try {
      if (typeof this.#client.query === 'function') {
        await this.#client.query('SELECT 1');
      } else if (typeof this.#client.raw === 'function') {
        await this.#client.raw('SELECT 1');
      }
      return {
        healthy: true,
        status: 'connected',
        latencyMs: Date.now() - start
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        latencyMs: Date.now() - start,
        error: error.message
      };
    }
  }

  /**
   * Return SQL client pool / query builder
   * @returns {any}
   */
  getClient() {
    return this.#client;
  }
}

export default SqlAdapter;

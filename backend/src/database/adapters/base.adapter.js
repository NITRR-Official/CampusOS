/**
 * Abstract Base Database Adapter
 * Defines the contract that every database engine (MongoDB, SQL, etc.) must implement.
 */
export class DatabaseAdapter {
  constructor(name) {
    if (new.target === DatabaseAdapter) {
      throw new TypeError(
        'Cannot construct DatabaseAdapter instances directly'
      );
    }
    this.name = name;
  }

  /**
   * Connect to the database
   * @param {Object} [config] - Optional configuration overrides
   * @returns {Promise<boolean>}
   */
  // eslint-disable-next-line no-unused-vars
  async connect(config = {}) {
    throw new Error(
      `Method connect() must be implemented by ${this.name} adapter.`
    );
  }

  /**
   * Disconnect and release connection pool
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error(
      `Method disconnect() must be implemented by ${this.name} adapter.`
    );
  }

  /**
   * Check if the database connection is currently active
   * @returns {boolean}
   */
  isConnected() {
    throw new Error(
      `Method isConnected() must be implemented by ${this.name} adapter.`
    );
  }

  /**
   * Perform an active ping/health check against the database
   * @returns {Promise<{ healthy: boolean, status: string, latencyMs?: number, error?: string }>}
   */
  async healthCheck() {
    throw new Error(
      `Method healthCheck() must be implemented by ${this.name} adapter.`
    );
  }

  /**
   * Return the underlying database client (e.g., mongoose connection, knex query builder)
   * @returns {any}
   */
  getClient() {
    throw new Error(
      `Method getClient() must be implemented by ${this.name} adapter.`
    );
  }
}

export default DatabaseAdapter;

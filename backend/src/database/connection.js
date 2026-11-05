/**
 * Database Connection Facade
 * Provides backward-compatible exports for existing plugins, tests, and core server,
 * backed by the extensible DatabaseManager and DatabaseAdapter pattern.
 */

import { databaseManager } from './database-manager.js';

/**
 * Connect to database
 * @param {string} [uri] - Database connection URI
 * @returns {Promise<boolean>}
 */
export async function connectDB(uri) {
  return databaseManager.connect('mongo', uri ? { uri } : {});
}

/**
 * Disconnect from all databases
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  return databaseManager.closeAll();
}

/**
 * Check database health
 * @returns {Promise<{ healthy: boolean, databases: Record<string, any>, timestamp: string }>}
 */
export async function healthCheck() {
  return databaseManager.getHealth();
}

/**
 * Get primary database connection status
 * @returns {boolean}
 */
export function isDBConnected() {
  return databaseManager.isConnected('mongo');
}

export { databaseManager };

export default {
  connectDB,
  disconnectDB,
  healthCheck,
  isDBConnected,
  databaseManager
};

/**
 * Dynamic Permission Registry
 * Allows plugins to register their available atomic permissions at runtime.
 * This ensures the core system knows about all permissions without static coupling.
 */

export class PermissionRegistry {
  #permissions = new Map();

  constructor() {}

  /**
   * Register a new permission
   * @param {Object} permission
   * @param {string} permission.id - The atomic permission string (e.g., 'event:create')
   * @param {string} permission.module - The module it belongs to (e.g., 'event')
   * @param {string} permission.description - Description for the UI
   * @param {string} [permission.label] - Optional friendly name for the UI
   */
  register(permission) {
    if (!permission.id || !permission.module) {
      throw new Error('Permission must have an id and a module');
    }

    if (this.#permissions.has(permission.id)) {
      throw new Error(
        `[PermissionRegistry] Permission '${permission.id}' is already registered.`
      );
    }

    this.#permissions.set(
      permission.id,
      Object.freeze({
        id: permission.id,
        module: permission.module,
        description: permission.description || '',
        label: permission.label || permission.id
      })
    );
  }

  /**
   * Get all permissions grouped by module
   * @returns {Object} Grouped permissions { "event": [ ... ], "club": [ ... ] }
   */
  getAllGrouped() {
    const grouped = {};
    for (const perm of this.#permissions.values()) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }
    return grouped;
  }

  /**
   * Get all permissions as a flat list
   * @returns {Array} Array of all permissions
   */
  getAll() {
    return Array.from(this.#permissions.values());
  }

  /**
   * Check if a specific permission exists in the registry
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this.#permissions.has(id);
  }
}

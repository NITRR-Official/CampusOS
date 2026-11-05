import { PluginSecurityError } from '@campus-os/shared/plugin-contract';

/**
 * Creates a sandboxed EventBus proxy for community plugins.
 * Enforces namespace isolation on publishing and subscription whitelisting (ADR-017).
 *
 * @param {object} manifest - Plugin manifest
 * @param {object} globalEventBus - Global CampusEventBus instance
 * @param {object} [options]
 * @param {string[]} [options.grantedCapabilities]
 * @returns {object} Scoped EventBus proxy
 */
export function createScopedEventBus(manifest, globalEventBus, options = {}) {
  const pluginName = manifest?.name || 'unknown';
  const grantedCaps = new Set(
    options.grantedCapabilities || manifest?.capabilities || []
  );
  const declaredEvents = new Set(manifest?.consumes?.events || []);

  // Track listeners registered through this scoped bus to avoid wiping global listeners
  const registeredListeners = new Map(); // eventName -> Set<listener>

  function trackListener(eventName, listener) {
    if (!registeredListeners.has(eventName)) {
      registeredListeners.set(eventName, new Set());
    }
    registeredListeners.get(eventName).add(listener);
  }

  function untrackListener(eventName, listener) {
    if (registeredListeners.has(eventName)) {
      registeredListeners.get(eventName).delete(listener);
      if (registeredListeners.get(eventName).size === 0) {
        registeredListeners.delete(eventName);
      }
    }
  }

  const scopedBus = {
    /**
     * Emit an event. Community plugins may only emit events in their own namespace.
     * @param {string} eventName
     * @param {any} payload
     * @returns {Promise<boolean>}
     */
    emit: async (eventName, payload) => {
      const isOwnNamespace =
        eventName.startsWith(`${pluginName}:`) || eventName === pluginName;
      const isWildcardGranted = grantedCaps.has('*');

      if (!isOwnNamespace && !isWildcardGranted) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' is not authorized to emit event '${eventName}'. Community plugins can only emit events prefixed with '${pluginName}:'.`,
          pluginName,
          { eventName, allowedNamespace: `${pluginName}:*` }
        );
      }

      return globalEventBus.emit(eventName, payload);
    },

    /**
     * Subscribe to an event. Must be declared in consumes.events or in plugin's own namespace.
     * @param {string} eventName
     * @param {Function} listener
     * @returns {scopedBus}
     */
    on: (eventName, listener) => {
      const isOwnNamespace =
        eventName.startsWith(`${pluginName}:`) || eventName === pluginName;
      const isDeclared =
        declaredEvents.has(eventName) ||
        declaredEvents.has('*') ||
        grantedCaps.has('*');

      if (!isOwnNamespace && !isDeclared) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' is not authorized to subscribe to event '${eventName}'. Event must be declared in 'consumes.events'.`,
          pluginName,
          { eventName, declaredEvents: Array.from(declaredEvents) }
        );
      }

      trackListener(eventName, listener);
      globalEventBus.on(eventName, listener);
      return scopedBus;
    },

    /**
     * Subscribe one-time listener.
     */
    once: (eventName, listener) => {
      const isOwnNamespace =
        eventName.startsWith(`${pluginName}:`) || eventName === pluginName;
      const isDeclared =
        declaredEvents.has(eventName) ||
        declaredEvents.has('*') ||
        grantedCaps.has('*');

      if (!isOwnNamespace && !isDeclared) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' is not authorized to subscribe to event '${eventName}'. Event must be declared in 'consumes.events'.`,
          pluginName,
          { eventName, declaredEvents: Array.from(declaredEvents) }
        );
      }

      const wrapped = async (payload) => {
        untrackListener(eventName, wrapped);
        return listener(payload);
      };

      trackListener(eventName, wrapped);
      globalEventBus.once(eventName, wrapped);
      return scopedBus;
    },

    /**
     * Unsubscribe listener.
     */
    off: (eventName, listener) => {
      untrackListener(eventName, listener);
      globalEventBus.off(eventName, listener);
      return scopedBus;
    },

    removeListener: (eventName, listener) => {
      return scopedBus.off(eventName, listener);
    },

    /**
     * Remove all listeners registered by this scoped plugin instance only.
     */
    removeAllListeners: (eventName) => {
      if (eventName) {
        const listeners = registeredListeners.get(eventName);
        if (listeners) {
          for (const fn of listeners) {
            globalEventBus.off(eventName, fn);
          }
          registeredListeners.delete(eventName);
        }
      } else {
        for (const [evt, listeners] of registeredListeners.entries()) {
          for (const fn of listeners) {
            globalEventBus.off(evt, fn);
          }
        }
        registeredListeners.clear();
      }
      return scopedBus;
    },

    listenerCount: (eventName) => {
      return registeredListeners.get(eventName)?.size || 0;
    },

    eventNames: () => {
      return Array.from(registeredListeners.keys());
    }
  };

  return scopedBus;
}

export default createScopedEventBus;

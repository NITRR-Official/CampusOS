import { EventEmitter } from 'events';

class CampusEventBus {
  #emitter = new EventEmitter();

  constructor() {
    // Increase max listeners to prevent memory leak warnings as many plugins may listen to the same events
    this.#emitter.setMaxListeners(50);
  }

  on(eventName, listener) {
    this.#emitter.on(eventName, listener);
    return this;
  }

  once(eventName, listener) {
    this.#emitter.once(eventName, listener);
    return this;
  }

  off(eventName, listener) {
    this.#emitter.off(eventName, listener);
    return this;
  }

  /**
   * Emit an event to the global bus.
   * Convention: Do NOT emit sensitive data (PII, passwords). Emit IDs and non-sensitive metadata.
   *
   * @param {string} eventName - e.g., 'event:created', 'user:registered'
   * @param {Object} payload - The data payload containing IDs or basic details
   */
  emit(eventName, payload) {
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_EVENTS) {
      console.log(`[EventBus] Emitted: ${eventName}`, payload);
    }

    // Fix: Prevent Payload Mutability (The Reference Trap)
    // Deep clone the payload so that listeners cannot mutate the original object
    let safePayload = payload;
    if (payload !== undefined && payload !== null) {
      try {
        safePayload = structuredClone(payload);
      } catch {
        // Fallback if the object contains non-cloneable data (like functions)
        safePayload = Object.freeze({ ...payload });
      }
    }

    // Fix: Prevent Synchronous Blocking (The Speed Trap)
    // Defer the event emission to the end of the event loop iteration.
    // This instantly frees up the main thread (e.g., an HTTP response) so plugins don't block it.
    setImmediate(() => {
      this.#emitter.emit(eventName, safePayload);
    });

    return true;
  }
}

// Export a singleton instance
export const eventBus = new CampusEventBus();
export default eventBus;

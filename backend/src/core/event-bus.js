import { EventEmitter } from 'events';

class CampusEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners to prevent memory leak warnings as many plugins may listen to the same events
    this.setMaxListeners(50);
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
    return super.emit(eventName, payload);
  }
}

// Export a singleton instance
export const eventBus = new CampusEventBus();
export default eventBus;

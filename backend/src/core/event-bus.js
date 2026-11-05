import { EventEmitter } from 'events';

export class CampusEventBus {
  #emitter = new EventEmitter();
  #errorHandlers = new Set();

  constructor() {
    // Increase max listeners to prevent memory leak warnings as multiple plugins subscribe
    this.#emitter.setMaxListeners(100);
  }

  /**
   * Subscribe a listener to an event.
   * @param {string} eventName
   * @param {Function} listener - (payload) => void | Promise<void>
   * @returns {this}
   */
  on(eventName, listener) {
    this.#emitter.on(eventName, listener);
    return this;
  }

  /**
   * Subscribe a one-time listener to an event.
   * @param {string} eventName
   * @param {Function} listener
   * @returns {this}
   */
  once(eventName, listener) {
    this.#emitter.once(eventName, listener);
    return this;
  }

  /**
   * Unsubscribe a listener from an event.
   * @param {string} eventName
   * @param {Function} listener
   * @returns {this}
   */
  off(eventName, listener) {
    this.#emitter.off(eventName, listener);
    return this;
  }

  /**
   * Alias for off() to match EventEmitter API
   */
  removeListener(eventName, listener) {
    return this.off(eventName, listener);
  }

  /**
   * Remove all listeners for a given event, or all events if omitted.
   * @param {string} [eventName]
   * @returns {this}
   */
  removeAllListeners(eventName) {
    if (eventName !== undefined) {
      this.#emitter.removeAllListeners(eventName);
    } else {
      this.#emitter.removeAllListeners();
    }
    return this;
  }

  /**
   * Return number of listeners registered for an event.
   * @param {string} eventName
   * @returns {number}
   */
  listenerCount(eventName) {
    return this.#emitter.listenerCount(eventName);
  }

  /**
   * Register a global error hook invoked when any listener throws or rejects.
   * @param {Function} handler - ({ eventName, error, payload, timestamp }) => void
   * @returns {Function} Unsubscribe function
   */
  onError(handler) {
    if (typeof handler === 'function') {
      this.#errorHandlers.add(handler);
    }
    return () => this.#errorHandlers.delete(handler);
  }

  /**
   * Clone payload safely to prevent mutations across listeners.
   */
  #clonePayload(payload) {
    if (payload === undefined || payload === null) {
      return payload;
    }
    try {
      return structuredClone(payload);
    } catch {
      return Object.freeze({ ...payload });
    }
  }

  /**
   * Log and dispatch error to registered error hooks.
   */
  #notifyError(eventName, error, payload) {
    const errorInfo = {
      eventName,
      error,
      payload,
      timestamp: new Date().toISOString()
    };

    console.error(
      `[EventBus] Error in listener for "${eventName}":`,
      error?.stack || error?.message || error
    );

    for (const handler of this.#errorHandlers) {
      try {
        handler(errorInfo);
      } catch (handlerErr) {
        console.error('[EventBus] Error in onError handler:', handlerErr);
      }
    }
  }

  /**
   * Dispatch listeners concurrently using Promise.allSettled.
   * Ensures that sync throws and async rejections are isolated.
   */
  async #dispatch(eventName, safePayload) {
    const rawListeners = this.#emitter.rawListeners(eventName);
    if (!rawListeners || rawListeners.length === 0) {
      return [];
    }

    const promises = rawListeners.map(async (fn) => {
      try {
        return await fn(safePayload);
      } catch (err) {
        this.#notifyError(eventName, err, safePayload);
        throw err;
      }
    });

    return Promise.allSettled(promises);
  }

  /**
   * Emit an event asynchronously (fire-and-forget).
   * Defers execution via setImmediate and safely isolates errors so no unhandledRejection occurs.
   *
   * @param {string} eventName - e.g., 'event:created', 'user:deleted'
   * @param {Object} [payload] - The data payload containing IDs or basic details
   * @returns {boolean}
   */
  emit(eventName, payload) {
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_EVENTS) {
      console.log(`[EventBus] Emitted: ${eventName}`, payload);
    }

    const safePayload = this.#clonePayload(payload);

    setImmediate(() => {
      this.#dispatch(eventName, safePayload).catch((err) => {
        // Double-safety guard: allSettled never rejects, but this guarantees zero unhandled rejections
        this.#notifyError(eventName, err, safePayload);
      });
    });

    return true;
  }

  /**
   * Emit an event and await all listeners to settle.
   * Essential for tests, cascading operations, and transactional workflows.
   *
   * @param {string} eventName
   * @param {Object} [payload]
   * @returns {Promise<{ success: boolean, results: PromiseSettledResult<any>[], errors: Error[] }>}
   */
  async emitAsync(eventName, payload) {
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_EVENTS) {
      console.log(`[EventBus] EmittedAsync: ${eventName}`, payload);
    }

    const safePayload = this.#clonePayload(payload);
    const results = await this.#dispatch(eventName, safePayload);

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason);

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }
}

// Export singleton instance and class
export const eventBus = new CampusEventBus();
export default eventBus;

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * RequestContextManager
 * Provides request-scoped storage and caching backed by Node.js AsyncLocalStorage.
 * Enables zero-leakage, thread-safe memoization across asynchronous call stacks.
 */
export class RequestContextManager {
  #asyncLocalStorage = new AsyncLocalStorage();

  /**
   * Run a callback within an isolated request context store.
   * @param {Map|object} [store=new Map()]
   * @param {Function} callback
   * @returns {*}
   */
  run(store, callback) {
    const s = store || new Map();
    return this.#asyncLocalStorage.run(s, callback);
  }

  /**
   * Return the active store for the current asynchronous execution flow.
   * @returns {Map|undefined}
   */
  getStore() {
    return this.#asyncLocalStorage.getStore();
  }

  /**
   * Check if a request context is currently active.
   * @returns {boolean}
   */
  isActive() {
    return this.#asyncLocalStorage.getStore() !== undefined;
  }

  /**
   * Get a cached value by key.
   * @param {*} key
   * @returns {*}
   */
  get(key) {
    const store = this.#asyncLocalStorage.getStore();
    if (!store) return undefined;
    return store instanceof Map ? store.get(key) : store[key];
  }

  /**
   * Set a value in the active request context.
   * @param {*} key
   * @param {*} value
   * @returns {*}
   */
  set(key, value) {
    const store = this.#asyncLocalStorage.getStore();
    if (!store) return value;
    if (store instanceof Map) {
      store.set(key, value);
    } else {
      store[key] = value;
    }
    return value;
  }

  /**
   * Check if the active store contains the given key.
   * @param {*} key
   * @returns {boolean}
   */
  has(key) {
    const store = this.#asyncLocalStorage.getStore();
    if (!store) return false;
    return store instanceof Map
      ? store.has(key)
      : Object.prototype.hasOwnProperty.call(store, key);
  }

  /**
   * Delete a key from the active store.
   * @param {*} key
   * @returns {boolean}
   */
  delete(key) {
    const store = this.#asyncLocalStorage.getStore();
    if (!store) return false;
    return store instanceof Map ? store.delete(key) : delete store[key];
  }

  /**
   * Clear all entries from the active store.
   */
  clear() {
    const store = this.#asyncLocalStorage.getStore();
    if (store && store instanceof Map) {
      store.clear();
    }
  }

  /**
   * If key is present in active store, return cached value.
   * Otherwise call producerFn(), cache the result, and return it.
   * If no request context is active, executes and returns producerFn() without caching.
   * @param {*} key
   * @param {Function} producerFn
   * @returns {Promise<*>|*}
   */
  async computeIfAbsent(key, producerFn) {
    const store = this.#asyncLocalStorage.getStore();
    if (!store) {
      return await producerFn();
    }

    if (store instanceof Map) {
      if (store.has(key)) {
        return store.get(key);
      }
      const value = await producerFn();
      store.set(key, value);
      return value;
    }

    if (Object.prototype.hasOwnProperty.call(store, key)) {
      return store[key];
    }
    const value = await producerFn();
    store[key] = value;
    return value;
  }
}

// Global symbol to ensure a single singleton instance across all bundled / dynamic imports
const GLOBAL_KEY = Symbol.for('campusos.request_context');
if (!globalThis[GLOBAL_KEY]) {
  globalThis[GLOBAL_KEY] = new RequestContextManager();
}

export const RequestContext = globalThis[GLOBAL_KEY];
export default RequestContext;

/**
 * Module Registry
 * Central registry for managing plugin modules and services
 */

import { PermissionRegistry } from '../core/permission-registry.js';

class ModuleRegistry {
  #modules = new Map();
  #services = new Map();
  #authenticators = new Map();
  #resolvers = new Map();
  #permissions = new PermissionRegistry();
  #contextResolvers = new Map();
  #publicRoutes = [];
  #statProviders = new Map();
  #settingsConfigs = new Map();
  #pluginMetadata = new Map();

  constructor() {}

  get permissions() {
    return this.#permissions;
  }

  /**
   * Register a context resolver for permission checks
   */
  registerContextResolver(routePrefix, resolverFunc) {
    if (this.#contextResolvers.has(routePrefix)) {
      throw new Error(
        `Context resolver for '${routePrefix}' is already registered.`
      );
    }
    this.#contextResolvers.set(routePrefix, resolverFunc);
    console.log(`✓ Context Resolver registered for: ${routePrefix}`);
  }

  /**
   * Resolve context (e.g. clubId) dynamically from the request using registered resolvers
   */
  async resolveContext(req) {
    for (const [prefix, resolver] of this.#contextResolvers.entries()) {
      if (req.path.startsWith(prefix)) {
        try {
          return await resolver(req);
        } catch (err) {
          console.error(`Error resolving context for ${prefix}:`, err);
        }
      }
    }
    return null;
  }

  /**
   * Register a module
   */
  registerModule(name, module) {
    if (this.#modules.has(name)) {
      throw new Error(`Module '${name}' is already registered.`);
    }
    this.#modules.set(name, Object.freeze(module));
    console.log(`✓ Module registered: ${name}`);
  }

  /**
   * Get a registered module
   */
  getModule(name, throwOnMissing = true) {
    const module = this.#modules.get(name);
    if (!module && throwOnMissing) {
      throw new Error(`Module '${name}' is not registered or is disabled.`);
    }
    return module;
  }

  /**
   * Register a service
   */
  registerService(name, service) {
    if (this.#services.has(name)) {
      throw new Error(`Service '${name}' is already registered.`);
    }
    this.#services.set(name, Object.freeze(service));
    console.log(`✓ Service registered: ${name}`);
  }

  /**
   * Get a service
   */
  getService(name, throwOnMissing = true) {
    const service = this.#services.get(name);
    if (!service && throwOnMissing) {
      throw new Error(`Service '${name}' is not registered or is disabled.`);
    }
    return service;
  }

  /**
   * Register an authenticator (e.g., JWT, OAuth)
   */
  registerAuthenticator(name, authenticator) {
    if (this.#authenticators.has(name)) {
      throw new Error(`Authenticator '${name}' is already registered.`);
    }
    this.#authenticators.set(name, Object.freeze(authenticator));
    console.log(`✓ Authenticator registered: ${name}`);
  }

  /**
   * Get an authenticator
   */
  getAuthenticator(name, throwOnMissing = true) {
    const authenticator = this.#authenticators.get(name);
    if (!authenticator && throwOnMissing) {
      throw new Error(
        `Authenticator '${name}' is not registered or is disabled.`
      );
    }
    return authenticator;
  }

  /**
   * Register a resolver (GraphQL-style data fetcher)
   */
  registerResolver(name, resolver) {
    if (this.#resolvers.has(name)) {
      throw new Error(`Resolver '${name}' is already registered.`);
    }
    this.#resolvers.set(name, Object.freeze(resolver));
    console.log(`✓ Resolver registered: ${name}`);
  }

  /**
   * Get a resolver
   */
  getResolver(name, throwOnMissing = true) {
    const resolver = this.#resolvers.get(name);
    if (!resolver && throwOnMissing) {
      throw new Error(`Resolver '${name}' is not registered or is disabled.`);
    }
    return resolver;
  }

  /**
   * Get all registered modules
   */
  getAllModules() {
    return Array.from(this.#modules.keys());
  }

  /**
   * Get all registered services
   */
  getAllServices() {
    return Array.from(this.#services.keys());
  }

  /**
   * Register a stat provider function for the dashboard
   */
  registerStatProvider(pluginId, fetcherFunction) {
    if (this.#statProviders.has(pluginId)) {
      throw new Error(
        `Stat provider for plugin '${pluginId}' is already registered.`
      );
    }
    this.#statProviders.set(pluginId, fetcherFunction);
    console.log(`✓ Stat provider registered: ${pluginId}`);
  }

  /**
   * Get all registered stat providers
   */
  getAllStatProviders() {
    return Array.from(this.#statProviders.entries());
  }

  /**
   * Register a configurable settings schema for a plugin
   * @param {string} pluginId - The unique plugin ID
   * @param {Object} schema - The settings schema (e.g. { fields: [...] })
   */
  registerSettingsConfig(pluginId, schema) {
    if (this.#settingsConfigs.has(pluginId)) {
      throw new Error(
        `Settings config for plugin '${pluginId}' is already registered.`
      );
    }
    this.#settingsConfigs.set(pluginId, schema);
    console.log(`✓ Settings config registered: ${pluginId}`);
  }

  /**
   * Get settings config for a plugin
   */
  getSettingsConfig(pluginId) {
    return this.#settingsConfigs.get(pluginId) || null;
  }

  /**
   * Get all registered settings configs
   */
  getAllSettingsConfigs() {
    return Object.fromEntries(this.#settingsConfigs);
  }

  /**
   * Register a plugin's raw metadata (e.g. plugin.json)
   * @param {string} pluginId
   * @param {Object} metadata
   */
  registerPluginMetadata(pluginId, metadata) {
    if (this.#pluginMetadata.has(pluginId)) {
      throw new Error(
        `Metadata for plugin '${pluginId}' is already registered.`
      );
    }
    this.#pluginMetadata.set(pluginId, metadata);
    console.log(`✓ Plugin metadata registered: ${pluginId}`);
  }

  /**
   * Get plugin metadata
   */
  getPluginMetadata(pluginId) {
    return this.#pluginMetadata.get(pluginId) || null;
  }

  /**
   * Register a public route regex that bypasses authentication
   * @param {RegExp} regex - The regex matching the path
   * @param {string} [method] - Optional HTTP method (e.g. 'GET', 'POST'). If omitted, matches all methods.
   */
  registerPublicRoute(regex, method = null) {
    if (!(regex instanceof RegExp)) {
      throw new Error('Public route must be a RegExp instance');
    }
    this.#publicRoutes.push({ regex, method });
    console.log(
      `✓ Public route registered: ${method ? method + ' ' : 'ANY '}${regex.toString()}`
    );
  }

  /**
   * Get all public route regexes
   */
  getPublicRoutes() {
    return [...this.#publicRoutes];
  }

  /**
   * Clear all registrations (useful for test teardowns)
   */
  reset() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('registry.reset() is only allowed in test environments.');
    }
    this.#modules.clear();
    this.#services.clear();
    this.#authenticators.clear();
    this.#resolvers.clear();
    this.#contextResolvers.clear();
    this.#statProviders.clear();
    this.#settingsConfigs.clear();
    this.#pluginMetadata.clear();
    this.#publicRoutes = [];
    // Assuming PermissionRegistry has a clear/reset method, or we can just replace it
    this.#permissions = new PermissionRegistry();
    console.log('✓ Module Registry reset');
  }
}

export default new ModuleRegistry();

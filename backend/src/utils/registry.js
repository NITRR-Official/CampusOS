/**
 * Module Registry
 * Central registry for managing plugin modules and services
 */

import { PermissionRegistry } from '../core/permission-registry.js';

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.services = new Map();
    this.authenticators = new Map();
    this.resolvers = new Map();
    this.permissions = new PermissionRegistry();
    this.contextResolvers = new Map();
  }

  /**
   * Register a context resolver for permission checks
   * e.g. registry.registerContextResolver('/api/v1/events', async (req) => event.clubId)
   */
  registerContextResolver(routePrefix, resolverFunc) {
    this.contextResolvers.set(routePrefix, resolverFunc);
    console.log(`✓ Context Resolver registered for: ${routePrefix}`);
  }

  /**
   * Resolve context (e.g. clubId) dynamically from the request using registered resolvers
   */
  async resolveContext(req) {
    for (const [prefix, resolver] of this.contextResolvers.entries()) {
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
    this.modules.set(name, module);
    console.log(`✓ Module registered: ${name}`);
  }

  /**
   * Get a registered module
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * Register a service
   */
  registerService(name, service) {
    this.services.set(name, service);
    console.log(`✓ Service registered: ${name}`);
  }

  /**
   * Get a service
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Register an authenticator (e.g., JWT, OAuth)
   */
  registerAuthenticator(name, authenticator) {
    this.authenticators.set(name, authenticator);
    console.log(`✓ Authenticator registered: ${name}`);
  }

  /**
   * Get an authenticator
   */
  getAuthenticator(name) {
    return this.authenticators.get(name);
  }

  /**
   * Register a resolver (GraphQL-style data fetcher)
   */
  registerResolver(name, resolver) {
    this.resolvers.set(name, resolver);
    console.log(`✓ Resolver registered: ${name}`);
  }

  /**
   * Get a resolver
   */
  getResolver(name) {
    return this.resolvers.get(name);
  }

  /**
   * Get all registered modules
   */
  getAllModules() {
    return Array.from(this.modules.keys());
  }

  /**
   * Get all registered services
   */
  getAllServices() {
    return Array.from(this.services.keys());
  }
}

export default new ModuleRegistry();

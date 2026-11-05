import {
  AccessDeniedError,
  PluginSecurityError
} from '@campus-os/shared/plugin-contract';

/**
 * Creates a capability-sandboxed proxy around ModuleRegistry for community plugins.
 * Enforces "Business Services Allowed, Raw Database Forbidden" (ADR-017).
 *
 * @param {object} manifest - Plugin manifest
 * @param {object} globalRegistry - Global ModuleRegistry singleton
 * @param {object} [options]
 * @param {string[]} [options.grantedCapabilities] - Administrator-approved capabilities
 * @returns {object} Sandboxed registry proxy
 */
export function createScopedRegistry(manifest, globalRegistry, options = {}) {
  const pluginName = manifest?.name || 'unknown';
  const grantedCaps = new Set(
    options.grantedCapabilities || manifest?.capabilities || []
  );
  const declaredResolvers = new Set(manifest?.consumes?.resolvers || []);

  const FORBIDDEN_SERVICES = new Set([
    'db:mongo',
    'db:sql',
    'db:manager',
    'core:models'
  ]);

  const SAFE_UTILITY_SERVICES = new Set([
    'core:logger',
    'core:request_context'
  ]);

  function isForbiddenService(serviceName) {
    if (FORBIDDEN_SERVICES.has(serviceName)) return true;
    if (serviceName.startsWith('db:')) return true;
    return false;
  }

  function hasServiceCapability(serviceName) {
    if (grantedCaps.has('*')) return true;
    if (grantedCaps.has(serviceName)) return true;

    for (const cap of grantedCaps) {
      if (cap === serviceName) return true;
      if (cap.startsWith(serviceName + ':')) return true;
      if (serviceName.startsWith(cap + ':')) return true;

      const parts = serviceName.split(':');
      if (
        parts[0] &&
        (cap === `service:${parts[0]}` ||
          cap.startsWith(`service:${parts[0]}:`) ||
          cap.startsWith(`${parts[0]}:`))
      ) {
        return true;
      }
    }
    return false;
  }

  // Scoped permissions proxy to prevent permission squatting
  const scopedPermissions = {
    register: (permObj) => {
      const permName = permObj?.name || '';
      if (!permName.startsWith(`${pluginName}:`) && permName !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register permission '${permName}'. Permission name must be prefixed with '${pluginName}:'.`,
          pluginName,
          { permission: permName }
        );
      }
      return globalRegistry.permissions.register(permObj);
    },
    registerAll: (permArray) => {
      for (const p of permArray) {
        scopedPermissions.register(p);
      }
    },
    has: (permName) => globalRegistry.permissions.has(permName),
    get: (permName) => globalRegistry.permissions.get(permName),
    getAll: () => globalRegistry.permissions.getAll(),
    getAllGrouped: () => globalRegistry.permissions.getAllGrouped()
  };

  const scopedRegistry = {
    get permissions() {
      return scopedPermissions;
    },

    getService: (name, throwOnMissing = true) => {
      if (isForbiddenService(name)) {
        throw new AccessDeniedError(
          `Access denied: Plugin '${pluginName}' cannot access raw database service '${name}'. Direct database access is restricted to core plugins.`,
          pluginName,
          { service: name }
        );
      }

      if (SAFE_UTILITY_SERVICES.has(name)) {
        return globalRegistry.getService(name, throwOnMissing);
      }

      if (!hasServiceCapability(name)) {
        throw new AccessDeniedError(
          `Access denied: Plugin '${pluginName}' lacks capability to access service '${name}'. Required capability was not granted by administrator.`,
          pluginName,
          { service: name, grantedCapabilities: Array.from(grantedCaps) }
        );
      }

      return globalRegistry.getService(name, throwOnMissing);
    },

    registerService: (name, service) => {
      if (!name.startsWith(`${pluginName}:`) && name !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register service '${name}'. Community plugins may only register services prefixed with '${pluginName}:'.`,
          pluginName,
          { attemptedName: name }
        );
      }
      return globalRegistry.registerService(name, service);
    },

    getResolver: (name, throwOnMissing = true) => {
      if (
        !grantedCaps.has('*') &&
        !declaredResolvers.has('*') &&
        !declaredResolvers.has(name)
      ) {
        throw new AccessDeniedError(
          `Access denied: Plugin '${pluginName}' has not declared resolver '${name}' in consumes.resolvers.`,
          pluginName,
          { resolver: name, declaredResolvers: Array.from(declaredResolvers) }
        );
      }
      return globalRegistry.getResolver(name, throwOnMissing);
    },

    registerResolver: (name, resolver) => {
      if (!name.startsWith(`${pluginName}:`) && name !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register resolver '${name}'. Community plugins may only register resolvers prefixed with '${pluginName}:'.`,
          pluginName,
          { attemptedName: name }
        );
      }
      return globalRegistry.registerResolver(name, resolver);
    },

    registerContextResolver: (routePrefix, resolverFunc) => {
      const allowedNamespace = `/api/v1/${pluginName}`;
      if (
        !routePrefix.startsWith(allowedNamespace) &&
        !routePrefix.startsWith(`/api/${pluginName}`)
      ) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register context resolver for route '${routePrefix}'. Community plugins may only register resolvers for their own route namespace ('${allowedNamespace}').`,
          pluginName,
          { routePrefix, allowedNamespace }
        );
      }
      return globalRegistry.registerContextResolver(routePrefix, resolverFunc);
    },

    registerPublicRoute: (regex, method = null) => {
      const regexStr = regex.toString();
      if (!regexStr.includes(pluginName)) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register public route '${regexStr}'. Regex must be scoped to plugin path.`,
          pluginName,
          { regex: regexStr }
        );
      }
      return globalRegistry.registerPublicRoute(regex, method);
    },

    registerStatProvider: (pluginId, fetcherFunction) => {
      if (pluginId !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register stat provider for '${pluginId}'.`,
          pluginName,
          { pluginId }
        );
      }
      return globalRegistry.registerStatProvider(pluginId, fetcherFunction);
    },

    registerSettingsConfig: (pluginId, schema) => {
      if (pluginId !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register settings config for '${pluginId}'.`,
          pluginName,
          { pluginId }
        );
      }
      return globalRegistry.registerSettingsConfig(pluginId, schema);
    },

    // Read methods delegated directly
    getAllModules: () => globalRegistry.getAllModules(),
    getModule: (name, throwOnMissing = true) =>
      globalRegistry.getModule(name, throwOnMissing),
    getAllServices: () => globalRegistry.getAllServices(),
    getSettingsConfig: (pluginId) => globalRegistry.getSettingsConfig(pluginId),
    getAllSettingsConfigs: () => globalRegistry.getAllSettingsConfigs(),
    getPluginMetadata: (pluginId) => globalRegistry.getPluginMetadata(pluginId),
    getPublicRoutes: () => globalRegistry.getPublicRoutes(),
    getAllStatProviders: () => globalRegistry.getAllStatProviders(),
    resolveContext: (req) => globalRegistry.resolveContext(req),
    getAuthenticator: (name, throwOnMissing = true) =>
      globalRegistry.getAuthenticator(name, throwOnMissing),

    registerPluginMetadata: (pluginId, metadata) => {
      if (pluginId !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register metadata for '${pluginId}'.`,
          pluginName,
          { pluginId }
        );
      }
      return globalRegistry.registerPluginMetadata(pluginId, metadata);
    }
  };

  return scopedRegistry;
}

export default createScopedRegistry;

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
  const isCore = options.isCore === true;
  const grantedCaps = new Set(
    options.grantedCapabilities || manifest?.capabilities || []
  );
  if (isCore) {
    grantedCaps.add('*');
  }
  const declaredResolvers = new Set(manifest?.consumes?.resolvers || []);

  // Track all resources registered by this scoped registry for graceful teardown (Issue #124)
  const registeredServices = new Set();
  const registeredResolvers = new Set();
  const registeredContextResolvers = new Set();
  const registeredStatProviders = new Set();
  const registeredSettingsConfigs = new Set();
  const registeredPermissions = new Set();
  const registeredPublicRoutes = new Set();
  const activeTimers = new Set();

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
    if (isCore) return false;
    if (FORBIDDEN_SERVICES.has(serviceName)) return true;
    if (serviceName.startsWith('db:')) return true;
    return false;
  }

  function hasServiceCapability(serviceName) {
    if (isCore || grantedCaps.has('*')) return true;
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

  // Scoped timer utilities automatically tracked and cleared on teardown
  const timers = {
    setInterval: (callback, ms, ...args) => {
      const timer = setInterval(callback, ms, ...args);
      activeTimers.add(timer);
      return timer;
    },
    clearInterval: (timer) => {
      clearInterval(timer);
      activeTimers.delete(timer);
    },
    setTimeout: (callback, ms, ...args) => {
      const timer = setTimeout(
        (...cbArgs) => {
          activeTimers.delete(timer);
          callback(...cbArgs);
        },
        ms,
        ...args
      );
      activeTimers.add(timer);
      return timer;
    },
    clearTimeout: (timer) => {
      clearTimeout(timer);
      activeTimers.delete(timer);
    },
    clearAll: () => {
      for (const t of activeTimers) {
        clearInterval(t);
        clearTimeout(t);
      }
      activeTimers.clear();
    },
    get count() {
      return activeTimers.size;
    }
  };

  // Scoped permissions proxy to prevent permission squatting
  const scopedPermissions = {
    register: (permObj) => {
      const permName = permObj?.name || permObj?.id || '';
      if (
        !isCore &&
        !permName.startsWith(`${pluginName}:`) &&
        permName !== pluginName
      ) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register permission '${permName}'. Permission name must be prefixed with '${pluginName}:'.`,
          pluginName,
          { permission: permName }
        );
      }
      registeredPermissions.add(permObj.id || permObj.name);
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

    get timers() {
      return timers;
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
      if (
        !isCore &&
        !name.startsWith(`${pluginName}:`) &&
        name !== pluginName
      ) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register service '${name}'. Community plugins may only register services prefixed with '${pluginName}:'.`,
          pluginName,
          { attemptedName: name }
        );
      }
      registeredServices.add(name);
      return globalRegistry.registerService(name, service);
    },

    getResolver: (name, throwOnMissing = true) => {
      if (
        !isCore &&
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
      if (
        !isCore &&
        !name.startsWith(`${pluginName}:`) &&
        name !== pluginName
      ) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register resolver '${name}'. Community plugins may only register resolvers prefixed with '${pluginName}:'.`,
          pluginName,
          { attemptedName: name }
        );
      }
      registeredResolvers.add(name);
      return globalRegistry.registerResolver(name, resolver);
    },

    registerContextResolver: (routePrefix, resolverFunc) => {
      const allowedNamespace = `/api/v1/${pluginName}`;
      if (
        !isCore &&
        !routePrefix.startsWith(allowedNamespace) &&
        !routePrefix.startsWith(`/api/${pluginName}`)
      ) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register context resolver for route '${routePrefix}'. Community plugins may only register resolvers for their own route namespace ('${allowedNamespace}').`,
          pluginName,
          { routePrefix, allowedNamespace }
        );
      }
      registeredContextResolvers.add(routePrefix);
      return globalRegistry.registerContextResolver(routePrefix, resolverFunc);
    },

    registerPublicRoute: (regex, method = null) => {
      const regexStr = regex.toString();
      if (!isCore && !regexStr.includes(pluginName)) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register public route '${regexStr}'. Regex must be scoped to plugin path.`,
          pluginName,
          { regex: regexStr }
        );
      }
      registeredPublicRoutes.add(regex);
      return globalRegistry.registerPublicRoute(regex, method);
    },

    registerStatProvider: (pluginId, fetcherFunction) => {
      if (!isCore && pluginId !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register stat provider for '${pluginId}'.`,
          pluginName,
          { pluginId }
        );
      }
      registeredStatProviders.add(pluginId);
      return globalRegistry.registerStatProvider(pluginId, fetcherFunction);
    },

    registerSettingsConfig: (pluginId, schema) => {
      if (!isCore && pluginId !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register settings config for '${pluginId}'.`,
          pluginName,
          { pluginId }
        );
      }
      registeredSettingsConfigs.add(pluginId);
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
      if (!isCore && pluginId !== pluginName) {
        throw new PluginSecurityError(
          `Security error: Plugin '${pluginName}' cannot register metadata for '${pluginId}'.`,
          pluginName,
          { pluginId }
        );
      }
      return globalRegistry.registerPluginMetadata(pluginId, metadata);
    },

    /**
     * Gracefully cleans up all resources registered through this scoped registry (Issue #124).
     */
    cleanup: () => {
      timers.clearAll();

      for (const sName of registeredServices) {
        globalRegistry.unregisterService?.(sName);
      }
      registeredServices.clear();

      for (const rName of registeredResolvers) {
        globalRegistry.unregisterResolver?.(rName);
      }
      registeredResolvers.clear();

      for (const prefix of registeredContextResolvers) {
        globalRegistry.unregisterContextResolver?.(prefix);
      }
      registeredContextResolvers.clear();

      for (const id of registeredStatProviders) {
        globalRegistry.unregisterStatProvider?.(id);
      }
      registeredStatProviders.clear();

      for (const id of registeredSettingsConfigs) {
        globalRegistry.unregisterSettingsConfig?.(id);
      }
      registeredSettingsConfigs.clear();

      for (const permId of registeredPermissions) {
        globalRegistry.permissions?.unregister?.(permId);
      }
      registeredPermissions.clear();

      for (const regex of registeredPublicRoutes) {
        globalRegistry.unregisterPublicRoute?.(
          (r) => r.regex?.source === regex.source
        );
      }
      registeredPublicRoutes.clear();

      globalRegistry.unregisterPluginMetadata?.(pluginName);
    }
  };

  return scopedRegistry;
}

export default createScopedRegistry;

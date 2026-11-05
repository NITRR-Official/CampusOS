/**
 * Plugin Loader System
 * Dynamically discovers, validates, and loads modules from /plugins/ directory
 * enforcing strict Zod schema validation, dependency resolution, and contract compliance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import semver from 'semver';
import {
  validatePluginManifest,
  validatePluginModule,
  PluginContractError
} from '@campus-os/shared/plugin-contract';
import { Plugin } from './database/schemas/index.js';
import { eventBus } from './core/event-bus.js';
import { rootLogger } from './core/logger.js';
import {
  OFFICIAL_CORE_PLUGINS,
  verifyPluginProvenance
} from './core/plugin-provenance.js';
import { createScopedRegistry } from './core/sandbox-registry.js';
import { createScopedEventBus } from './core/sandbox-event-bus.js';
import { runPendingMigrations } from './database/migration-runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store of currently loaded and active plugins (Issue #124)
const activePlugins = new Map();

export async function loadPlugins(app, registry, options = {}) {
  const isProd =
    process.env.NODE_ENV === 'production' || options.failFast === true;
  const logger = options.logger || rootLogger;
  const appsDir =
    options.pluginsDir || path.join(__dirname, '../..', 'plugins');

  if (!fs.existsSync(appsDir)) {
    console.warn('⚠️  /plugins directory not found. No plugins loaded.');
    return;
  }

  // 1. Fetch DB configs (only if DB connection is active)
  const pluginConfig = {};
  const pluginDbRecords = new Map();
  const isDbConnected = Plugin.db?.readyState === 1 && !options.skipDb;

  if (isDbConnected) {
    try {
      const dbPlugins = await Plugin.find({});
      for (const p of dbPlugins) {
        pluginConfig[p.name] = p.enabled;
        pluginDbRecords.set(p.name, p);
      }
    } catch (err) {
      if (isProd) throw err;
      console.warn('⚠️  Could not fetch plugin configs from DB:', err.message);
    }
  }

  const directories = fs.readdirSync(appsDir);
  console.log(`\n📦 Discovered ${directories.length} folder(s) in /plugins...`);

  // 2. Discover and Strictly Validate manifests
  const discoveredPlugins = new Map();

  for (const folderName of directories) {
    const modulePath = path.join(appsDir, folderName);
    const stat = fs.statSync(modulePath);
    if (!stat.isDirectory()) continue;

    const manifestPath = path.join(modulePath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      const err = new PluginContractError(
        `Missing plugin.json manifest in folder '${folderName}'`,
        folderName
      );
      if (isProd) throw err;
      console.warn(`⚠️  Skipped folder '${folderName}': Missing plugin.json`);
      continue;
    }

    let rawManifest;
    try {
      rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      const parseErr = new PluginContractError(
        `Malformed JSON in '${manifestPath}': ${err.message}`,
        folderName
      );
      if (isProd) throw parseErr;
      console.error(`✗ Malformed JSON in '${folderName}':`, err.message);
      continue;
    }

    let manifest;
    try {
      manifest = validatePluginManifest(rawManifest, folderName);
    } catch (err) {
      if (isProd) throw err;
      console.error(
        `✗ Invalid plugin manifest in '${folderName}':`,
        err.message
      );
      continue;
    }

    // Check if new plugin not in DB
    const isOfficial = OFFICIAL_CORE_PLUGINS.has(manifest.name);
    let dbRecord = pluginDbRecords.get(manifest.name);

    if (typeof pluginConfig[manifest.name] === 'undefined') {
      const isEnabled = manifest.defaultEnabled !== false;
      const initialTier = isOfficial ? 'core' : manifest.tier || 'community';
      const initialGranted = isOfficial ? ['*'] : [];

      if (isDbConnected) {
        console.log(
          `[Config] New plugin '${manifest.name}' discovered. Inserting to DB as ${isEnabled ? 'enabled' : 'disabled'}.`
        );
        try {
          dbRecord = await Plugin.create({
            name: manifest.name,
            enabled: isEnabled,
            tier: initialTier,
            trusted: isOfficial,
            requestedCapabilities: manifest.capabilities || [],
            grantedCapabilities: initialGranted
          });
          pluginDbRecords.set(manifest.name, dbRecord);
        } catch {
          // In unit tests or mock DB environments, continue with in-memory state
        }
      }
      pluginConfig[manifest.name] = isEnabled;
    } else if (dbRecord && isDbConnected && manifest.capabilities) {
      // Sync requestedCapabilities if manifest updated
      const currentRequested = dbRecord.requestedCapabilities || [];
      const manifestCaps = manifest.capabilities || [];
      if (
        JSON.stringify(currentRequested.slice().sort()) !==
        JSON.stringify(manifestCaps.slice().sort())
      ) {
        try {
          await Plugin.updateOne(
            { name: manifest.name },
            { $set: { requestedCapabilities: manifestCaps } }
          );
          dbRecord.requestedCapabilities = manifestCaps;
        } catch {
          // best-effort sync
        }
      }
    }

    if (pluginConfig[manifest.name] !== true) {
      console.log(`⏸️  Skipped plugin: ${manifest.name} (Disabled in DB)`);
      continue;
    }

    const isTrusted = dbRecord ? Boolean(dbRecord.trusted) : isOfficial;
    const grantedCapabilities =
      dbRecord?.grantedCapabilities ||
      (isOfficial
        ? ['*']
        : options.grantedCapabilitiesMap?.[manifest.name] || []);

    discoveredPlugins.set(manifest.name, {
      name: manifest.name,
      version: manifest.version,
      dependencies: manifest.dependencies || {},
      modulePath,
      manifest,
      trusted: isTrusted,
      grantedCapabilities
    });
  }

  // 3. Resolve dependencies & semver checks
  const enabledPlugins = Array.from(discoveredPlugins.values());
  const validPlugins = new Map(); // name -> plugin config

  // Recursive function to check if a plugin and all its dependencies are valid
  const checkDependencies = (
    pluginConfigItem,
    pluginMap,
    checked,
    valid,
    stack = new Set()
  ) => {
    if (valid.has(pluginConfigItem.name)) return true;
    if (stack.has(pluginConfigItem.name)) {
      const msg = `Circular dependency detected involving plugin: ${pluginConfigItem.name}`;
      if (isProd) throw new PluginContractError(msg, pluginConfigItem.name);
      console.error(`✗ ${msg}`);
      return false;
    }
    if (checked.has(pluginConfigItem.name)) {
      return false;
    }
    checked.add(pluginConfigItem.name);
    stack.add(pluginConfigItem.name);

    for (const [depName, depVersionRange] of Object.entries(
      pluginConfigItem.dependencies
    )) {
      const depPlugin = pluginMap.get(depName);

      if (!depPlugin) {
        const msg = `Plugin '${pluginConfigItem.name}' failed to load: Missing dependency '${depName}'`;
        if (isProd) throw new PluginContractError(msg, pluginConfigItem.name);
        console.error(`✗ ${msg}`);
        return false;
      }

      if (!semver.satisfies(depPlugin.version, depVersionRange)) {
        const msg = `Plugin '${pluginConfigItem.name}' failed to load: Dependency '${depName}' version ${depPlugin.version} does not satisfy ${depVersionRange}`;
        if (isProd) throw new PluginContractError(msg, pluginConfigItem.name);
        console.error(`✗ ${msg}`);
        return false;
      }

      // Recursively check the dependency with current stack
      if (
        !checkDependencies(depPlugin, pluginMap, checked, valid, new Set(stack))
      ) {
        const msg = `Plugin '${pluginConfigItem.name}' failed to load: Dependency '${depName}' failed to load`;
        if (isProd) throw new PluginContractError(msg, pluginConfigItem.name);
        console.error(`✗ ${msg}`);
        return false;
      }
    }

    valid.set(pluginConfigItem.name, pluginConfigItem);
    return true;
  };

  for (const p of enabledPlugins) {
    checkDependencies(p, discoveredPlugins, new Set(), validPlugins);
  }

  // 4. Topological Sort
  const sortedPlugins = [];
  const visited = new Set();
  const tempMark = new Set();

  const visit = (pluginName) => {
    if (tempMark.has(pluginName)) {
      throw new PluginContractError(
        `Circular dependency detected involving plugin: ${pluginName}`,
        pluginName
      );
    }
    if (!visited.has(pluginName)) {
      tempMark.add(pluginName);

      const p = validPlugins.get(pluginName);
      if (p) {
        for (const depName of Object.keys(p.dependencies)) {
          visit(depName);
        }
      }

      tempMark.delete(pluginName);
      visited.add(pluginName);
      if (p) {
        sortedPlugins.push(p);
      }
    }
  };

  for (const pluginName of validPlugins.keys()) {
    visit(pluginName);
  }

  if (sortedPlugins.length > 0) {
    console.log(
      `\n🚀 Initializing ${sortedPlugins.length} valid plugins in order: \n   ${sortedPlugins.map((p) => p.name).join(' -> ')}\n`
    );
  }

  // 5. Load and init sequentially
  for (const plugin of sortedPlugins) {
    // 1. Verify plugin provenance and determine effective tier
    const { verifiedTier, demoted } = verifyPluginProvenance(plugin.manifest, {
      trusted: plugin.trusted,
      isProd,
      failFast: options.failFast
    });

    if (demoted) {
      console.warn(
        `⚠️ Plugin '${plugin.name}' claimed 'core' tier but is not official or trusted. Demoted to 'community'.`
      );
    }

    // If frontend-only plugin (backend: false), register metadata and skip backend entry
    if (plugin.manifest.backend === false) {
      registry.registerPluginMetadata(plugin.name, {
        ...plugin.manifest,
        effectiveTier: verifiedTier
      });
      console.log(
        `ℹ️ Registered frontend-only plugin: ${plugin.name} (v${plugin.version}) [${verifiedTier}]`
      );
      continue;
    }

    const entryCandidates = [
      path.join(plugin.modulePath, 'backend', 'src', 'index.js'),
      path.join(plugin.modulePath, 'backend', 'plugin.js')
    ];
    const moduleEntryPath = entryCandidates.find((entry) =>
      fs.existsSync(entry)
    );

    if (!moduleEntryPath) {
      const err = new PluginContractError(
        `Plugin '${plugin.name}' contract violation: Missing backend entrypoint (backend/src/index.js or backend/plugin.js)`,
        plugin.name,
        { modulePath: plugin.modulePath, entryCandidates }
      );
      if (isProd) throw err;
      console.warn(
        `⚠️  Skipped ${plugin.name}: no backend/src/index.js or backend/plugin.js entry point found`
      );
      continue;
    }

    try {
      // 2. Select sandboxed or unrestricted registry and eventBus based on verifiedTier
      let effectiveRegistry = registry;
      let effectiveEventBus = eventBus;

      if (verifiedTier === 'community') {
        effectiveRegistry = createScopedRegistry(plugin.manifest, registry, {
          grantedCapabilities: plugin.grantedCapabilities
        });
        effectiveEventBus = createScopedEventBus(plugin.manifest, eventBus, {
          grantedCapabilities: plugin.grantedCapabilities
        });
        console.log(
          `🔒 Sandboxed registry and eventBus initialized for: ${plugin.name}`
        );
      } else {
        effectiveRegistry = createScopedRegistry(plugin.manifest, registry, {
          grantedCapabilities: ['*'],
          isCore: true
        });
        effectiveEventBus = createScopedEventBus(plugin.manifest, eventBus, {
          grantedCapabilities: ['*'],
          isCore: true
        });
      }

      const loadedModule = await import(pathToFileURL(moduleEntryPath).href);
      const { init } = validatePluginModule(loadedModule, plugin.name);

      const pluginLogger = logger.child({ plugin: plugin.name });

      // Run pending database migrations prior to invoking init (Issue #126)
      await runPendingMigrations(plugin.name, plugin.modulePath, {
        logger: pluginLogger,
        version: plugin.version,
        registry: effectiveRegistry,
        storage: options.migrationStorage
      });

      await init(app, effectiveRegistry, effectiveEventBus, pluginLogger);
      registry.registerPluginMetadata(plugin.name, {
        ...plugin.manifest,
        effectiveTier: verifiedTier
      });

      activePlugins.set(plugin.name, {
        name: plugin.name,
        manifest: plugin.manifest,
        module: loadedModule,
        effectiveRegistry,
        effectiveEventBus,
        pluginLogger,
        tier: verifiedTier,
        app,
        dependencies: plugin.dependencies || plugin.manifest.dependencies || {}
      });

      console.log(
        `✓ Loaded plugin: ${plugin.name} (v${plugin.version}) [${verifiedTier}]`
      );
    } catch (error) {
      console.error(
        `✗ Failed to initialize plugin ${plugin.name}:`,
        error.message
      );
      throw error;
    }
  }

  // Register core:plugin_loader service in registry for runtime lifecycle management
  if (
    typeof registry?.registerService === 'function' &&
    (!registry.getService || !registry.getService('core:plugin_loader', false))
  ) {
    registry.registerService('core:plugin_loader', {
      unloadPlugin,
      getActivePlugins,
      isPluginActive
    });
  }
  if (registry) {
    registry.unloadPlugin = unloadPlugin;
  }

  console.log('\n✓ Plugin loading complete\n');
}

/**
 * Unloads an active plugin gracefully by invoking its destroy() lifecycle hook,
 * unbinding its event listeners, clearing timers, and pruning registered services (Issue #124).
 *
 * @param {string} pluginName - Name of the plugin to unload
 * @param {object} [options]
 * @param {number} [options.timeout=5000] - Max time in ms to wait for destroy() before timing out
 * @param {boolean} [options.force=false] - If true, bypasses dependency checks
 * @returns {Promise<{ success: boolean, pluginName: string, message?: string }>}
 */
export async function unloadPlugin(pluginName, options = {}) {
  const timeoutMs = options.timeout ?? 5000;
  const force = options.force === true;

  const pluginRecord = activePlugins.get(pluginName);
  if (!pluginRecord) {
    return {
      success: true,
      pluginName,
      message: `Plugin '${pluginName}' was not loaded or already unloaded`
    };
  }

  // 1. Dependency check: ensure no other active plugin depends on this plugin
  if (!force) {
    for (const [otherName, otherRecord] of activePlugins.entries()) {
      if (otherName === pluginName) continue;
      const deps =
        otherRecord.manifest?.dependencies || otherRecord.dependencies || {};
      if (deps[pluginName]) {
        throw new PluginContractError(
          `Cannot unload plugin '${pluginName}': active plugin '${otherName}' depends on it. Disable '${otherName}' first or use force: true.`,
          pluginName,
          { dependentPlugin: otherName }
        );
      }
    }
  }

  // 2. Invoke destroy / teardown lifecycle hook if exported
  const destroyFn =
    pluginRecord.module.destroy ||
    pluginRecord.module.teardown ||
    pluginRecord.module.default?.destroy ||
    pluginRecord.module.default?.teardown;

  if (typeof destroyFn === 'function') {
    try {
      let timerId;
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => {
          reject(
            new Error(
              `Plugin '${pluginName}' destroy() timed out after ${timeoutMs}ms`
            )
          );
        }, timeoutMs);
      });

      try {
        await Promise.race([
          Promise.resolve(
            destroyFn(
              pluginRecord.app,
              pluginRecord.effectiveRegistry,
              pluginRecord.effectiveEventBus,
              pluginRecord.pluginLogger
            )
          ),
          timeoutPromise
        ]);
      } finally {
        clearTimeout(timerId);
      }
    } catch (destroyError) {
      console.error(
        `⚠️ Error during destroy() of plugin '${pluginName}':`,
        destroyError.message
      );
      // Proceed to cleanup remaining resources so memory is not leaked even on error
    }
  }

  // 3. Clean up event bus listeners
  try {
    pluginRecord.effectiveEventBus?.cleanup?.();
  } catch (busErr) {
    console.error(
      `⚠️ Failed to cleanup event bus for '${pluginName}':`,
      busErr.message
    );
  }

  // 4. Clean up registry services, permissions, routes, and timers
  try {
    pluginRecord.effectiveRegistry?.cleanup?.();
  } catch (regErr) {
    console.error(
      `⚠️ Failed to cleanup registry for '${pluginName}':`,
      regErr.message
    );
  }

  // 5. Delete from active plugins map
  activePlugins.delete(pluginName);

  // 6. Emit plugin:unloaded event on core EventBus
  try {
    if (typeof eventBus.emitAsync === 'function') {
      await eventBus.emitAsync('plugin:unloaded', {
        pluginName,
        timestamp: new Date().toISOString()
      });
    } else {
      eventBus.emit('plugin:unloaded', {
        pluginName,
        timestamp: new Date().toISOString()
      });
    }
  } catch (emitErr) {
    console.error(
      `⚠️ Error emitting 'plugin:unloaded' for '${pluginName}':`,
      emitErr.message
    );
  }

  console.log(`✓ Gracefully unloaded plugin: ${pluginName}`);
  return { success: true, pluginName };
}

export function getActivePlugins() {
  return new Map(activePlugins);
}

export function isPluginActive(pluginName) {
  return activePlugins.has(pluginName);
}

export function resetActivePlugins() {
  activePlugins.clear();
}

export default loadPlugins;

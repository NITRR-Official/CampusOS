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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      }

      const loadedModule = await import(pathToFileURL(moduleEntryPath).href);
      const init = loadedModule.init || loadedModule.default;

      if (typeof init !== 'function') {
        throw new PluginContractError(
          `Plugin '${plugin.name}' contract violation: Module must export an 'init' function or default function`,
          plugin.name,
          { moduleEntryPath }
        );
      }

      const pluginLogger = logger.child({ plugin: plugin.name });
      await init(app, effectiveRegistry, effectiveEventBus, pluginLogger);
      registry.registerPluginMetadata(plugin.name, {
        ...plugin.manifest,
        effectiveTier: verifiedTier
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

  console.log('\n✓ Plugin loading complete\n');
}

export default loadPlugins;

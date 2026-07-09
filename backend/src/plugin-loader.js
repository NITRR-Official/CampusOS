/**
 * Plugin Loader System
 * Dynamically discovers and loads modules from /plugins/ directory using dependency graphs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import semver from 'semver';
import { Plugin } from './database/schemas/index.js';
import { eventBus } from './core/event-bus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadPlugins(app, registry) {
  const appsDir = path.join(__dirname, '../..', 'plugins');

  if (!fs.existsSync(appsDir)) {
    console.warn('⚠️  /plugins directory not found. No plugins loaded.');
    return;
  }

  // 1. Fetch DB configs
  const dbPlugins = await Plugin.find({});
  const pluginConfig = {};
  for (const p of dbPlugins) {
    pluginConfig[p.name] = p.enabled;
  }

  const directories = fs.readdirSync(appsDir);
  console.log(`\n📦 Discovered ${directories.length} folder(s) in /plugins...`);

  // 2. Discover manifests
  const discoveredPlugins = new Map();

  for (const folderName of directories) {
    const modulePath = path.join(appsDir, folderName);
    const stat = fs.statSync(modulePath);
    if (!stat.isDirectory()) continue;

    const manifestPath = path.join(modulePath, 'plugin.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`⚠️  Skipped folder '${folderName}': Missing plugin.json`);
      continue;
    }

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!manifest.name || !manifest.version) {
        console.error(
          `✗ Invalid manifest in ${folderName}: Missing name or version`
        );
        continue;
      }

      // Check if new plugin not in DB
      if (typeof pluginConfig[manifest.name] === 'undefined') {
        const corePlugins = [
          'auth',
          'club',
          'institute',
          'event',
          'checkin',
          'task',
          'calendar',
          'vendor',
          'resource',
          'scheduling',
          'budget',
          'plugin-manager'
        ];
        const isEnabled = corePlugins.includes(manifest.name);

        console.log(
          `[Config] New plugin '${manifest.name}' discovered. Inserting to DB as ${isEnabled ? 'enabled' : 'disabled'}.`
        );
        await Plugin.create({ name: manifest.name, enabled: isEnabled });
        pluginConfig[manifest.name] = isEnabled;
      }

      if (pluginConfig[manifest.name] !== true) {
        console.log(`⏸️  Skipped plugin: ${manifest.name} (Disabled in DB)`);
        continue;
      }

      discoveredPlugins.set(manifest.name, {
        name: manifest.name,
        version: manifest.version,
        dependencies: manifest.dependencies || {},
        modulePath
      });
    } catch (err) {
      console.error(
        `✗ Failed to read plugin.json in ${folderName}:`,
        err.message
      );
    }
  }

  // 3. Resolve dependencies & semver checks
  const enabledPlugins = Array.from(discoveredPlugins.values());
  const validPlugins = new Map(); // name -> plugin config

  // Recursive function to check if a plugin and all its dependencies are valid
  const checkDependencies = (pluginConfigItem, pluginMap, checked, valid) => {
    if (valid.has(pluginConfigItem.name)) return true;
    if (checked.has(pluginConfigItem.name)) {
      // Circular dependency during resolution or already processed as invalid
      return false;
    }
    checked.add(pluginConfigItem.name);

    for (const [depName, depVersionRange] of Object.entries(
      pluginConfigItem.dependencies
    )) {
      const depPlugin = pluginMap.get(depName);

      if (!depPlugin) {
        console.error(
          `✗ Plugin '${pluginConfigItem.name}' failed to load: Missing dependency '${depName}'`
        );
        return false;
      }

      if (!semver.satisfies(depPlugin.version, depVersionRange)) {
        console.error(
          `✗ Plugin '${pluginConfigItem.name}' failed to load: Dependency '${depName}' version ${depPlugin.version} does not satisfy ${depVersionRange}`
        );
        return false;
      }

      // Recursively check the dependency
      if (!checkDependencies(depPlugin, pluginMap, checked, valid)) {
        console.error(
          `✗ Plugin '${pluginConfigItem.name}' failed to load: Dependency '${depName}' failed to load`
        );
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
      throw new Error(
        `Circular dependency detected involving plugin: ${pluginName}`
      );
    }
    if (!visited.has(pluginName)) {
      tempMark.add(pluginName);

      const p = validPlugins.get(pluginName);
      for (const depName of Object.keys(p.dependencies)) {
        visit(depName);
      }

      tempMark.delete(pluginName);
      visited.add(pluginName);
      sortedPlugins.push(p);
    }
  };

  try {
    for (const pluginName of validPlugins.keys()) {
      visit(pluginName);
    }
  } catch (err) {
    console.error('🚨 Plugin loading aborted:', err.message);
    return;
  }

  if (sortedPlugins.length > 0) {
    console.log(
      `\n🚀 Initializing ${sortedPlugins.length} valid plugins in order: \n   ${sortedPlugins.map((p) => p.name).join(' -> ')}\n`
    );
  }

  // 5. Load and init sequentially
  for (const plugin of sortedPlugins) {
    const entryCandidates = [
      path.join(plugin.modulePath, 'backend', 'plugin.js'),
      path.join(plugin.modulePath, 'backend', 'src', 'index.js')
    ];
    const moduleEntryPath = entryCandidates.find((entry) =>
      fs.existsSync(entry)
    );

    if (!moduleEntryPath) {
      console.warn(
        `⚠️  Skipped ${plugin.name}: no backend/plugin.js or backend/src/index.js entry point found`
      );
      continue;
    }

    try {
      const loadedModule = await import(pathToFileURL(moduleEntryPath).href);
      const init = loadedModule.init || loadedModule.default;

      if (typeof init !== 'function') {
        throw new Error(
          `Module must export a default function or named 'init' function`
        );
      }

      await init(app, registry, eventBus);
      console.log(`✓ Loaded plugin: ${plugin.name} (v${plugin.version})`);
    } catch (error) {
      console.error(
        `✗ Failed to initialize plugin ${plugin.name}:`,
        error.message
      );
    }
  }

  console.log('\n✓ Plugin loading complete\n');
}

export default loadPlugins;

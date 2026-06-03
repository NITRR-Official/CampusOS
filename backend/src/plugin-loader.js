/**
 * Plugin Loader System
 * Dynamically discovers and loads modules from /apps/ directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Plugin } from './database/schemas/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadPlugins(app, registry) {
  const appsDir = path.join(__dirname, '../..', 'apps');

  if (!fs.existsSync(appsDir)) {
    console.warn('⚠️  /apps directory not found. No plugins loaded.');
    return;
  }

  // Read all existing plugins from DB
  const dbPlugins = await Plugin.find({});
  const pluginConfig = {};
  for (const p of dbPlugins) {
    pluginConfig[p.name] = p.enabled;
  }

  const modules = fs.readdirSync(appsDir);
  console.log(`\n📦 Discovered ${modules.length} plugin(s) in /apps...\n`);

  for (const moduleName of modules) {
    const modulePath = path.join(appsDir, moduleName);
    const stat = fs.statSync(modulePath);

    // Skip non-directories
    if (!stat.isDirectory()) continue;

    // Check if new plugin not in DB
    if (typeof pluginConfig[moduleName] === 'undefined') {
      console.log(`[Config] New plugin '${moduleName}' discovered. Inserting to DB as disabled by default.`);
      try {
        // By default, only core modules (auth, etc) might be true, but since we deleted plugins.json, 
        // we'll enable existing ones manually or assume anything discovered for the first time is disabled,
        // EXCEPT we want our current system to boot! So we'll enable everything the first time we migrate,
        // or just set default to false and let admin enable it.
        // Wait, if auth is disabled, you can't login! We MUST enable core plugins if DB is empty.
        
        const corePlugins = [
          'auth', 'club', 'institute', 'event', 'checkin', 
          'task', 'calendar', 'vendor', 'resource', 'scheduling', 
          'budget', 'plugin-manager'
        ];
        const isEnabled = corePlugins.includes(moduleName);
        
        await Plugin.create({ name: moduleName, enabled: isEnabled });
        pluginConfig[moduleName] = isEnabled;
        
        if (!isEnabled) {
          console.log(`⏸️  Skipped plugin: ${moduleName} (Disabled by default)`);
          continue;
        }
      } catch (err) {
        console.error(`Failed to register new plugin ${moduleName} in DB:`, err.message);
      }
    } else if (pluginConfig[moduleName] === false) {
      // Skip if disabled in DB
      console.log(`⏸️  Skipped plugin: ${moduleName} (Disabled in DB)`);
      continue;
    }

    const entryCandidates = [
      path.join(modulePath, 'plugin.js'),
      path.join(modulePath, 'src', 'index.js')
    ];
    const moduleEntryPath = entryCandidates.find((entry) =>
      fs.existsSync(entry)
    );

    if (!moduleEntryPath) {
      console.warn(
        `⚠️  Skipped ${moduleName}: no plugin.js or src/index.js entry point found`
      );
      continue;
    }

    try {
      // Dynamically import the module
      const loadedModule = await import(pathToFileURL(moduleEntryPath).href);
      const init = loadedModule.init || loadedModule.default;

      if (typeof init !== 'function') {
        throw new Error(
          `Module must export a default function or named 'init' function`
        );
      }

      // Initialize the module, passing Express app and registry
      await init(app, registry);

      console.log(`✓ Loaded plugin: ${moduleName}`);
    } catch (error) {
      console.error(`✗ Failed to load plugin ${moduleName}:`, error.message);
      // Don't block other modules from loading
    }
  }

  console.log('\n✓ Plugin loading complete\n');
}

export default loadPlugins;

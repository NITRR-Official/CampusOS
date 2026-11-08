import { installPluginPackage } from './plugin-installer.service.js';

let Plugin;
let globalRegistry;
let globalEventBus;

export function initPluginService(registry, eventBus) {
  globalRegistry = registry;
  globalEventBus = eventBus || registry?.getService('eventBus', false);
  const models = registry.getService('core:models');
  if (models && models.Plugin) {
    Plugin = models.Plugin;
  } else {
    throw new Error('core:models service not found in registry');
  }
}
export class PluginService {
  constructor(options = {}) {
    this.pluginsDir = options.pluginsDir;
  }

  setPluginsDir(dir) {
    this.pluginsDir = dir;
  }

  /**
   * Install a plugin package from a zip file or remote URL (Issue #163)
   */
  async installPlugin(options = {}) {
    return installPluginPackage({
      ...options,
      pluginsDir: options.pluginsDir || this.pluginsDir,
      dbModel: Plugin,
      eventBus: globalEventBus
    });
  }

  /**
   * Get all installed plugins and their status
   */
  async getPlugins() {
    try {
      const plugins = await Plugin.find(
        {},
        {
          name: 1,
          enabled: 1,
          version: 1,
          settings: 1,
          tier: 1,
          trusted: 1,
          requestedCapabilities: 1,
          grantedCapabilities: 1,
          _id: 0
        }
      ).lean();

      // Inject configSchema for each plugin
      for (const plugin of plugins) {
        plugin.configSchema = globalRegistry.getSettingsConfig(plugin.name);
      }

      return { success: true, plugins };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch plugins from DB: ' + error.message
      };
    }
  }

  /**
   * Toggle a plugin's enabled status
   */
  async togglePlugin(pluginName, enabled) {
    try {
      if (!enabled) {
        // Gracefully unload plugin runtime resources if active (Issue #124)
        try {
          const loaderService = globalRegistry?.getService(
            'core:plugin_loader',
            false
          );
          if (loaderService?.unloadPlugin) {
            await loaderService.unloadPlugin(pluginName);
          } else if (typeof globalRegistry?.unloadPlugin === 'function') {
            await globalRegistry.unloadPlugin(pluginName);
          }
        } catch (unloadError) {
          console.warn(
            `[PluginService] Notice during teardown of '${pluginName}':`,
            unloadError.message
          );
        }
      }

      const result = await Plugin.findOneAndUpdate(
        { name: pluginName },
        { enabled },
        { returnDocument: 'after' }
      );

      if (!result) {
        return {
          success: false,
          error: `Plugin '${pluginName}' not found in database`
        };
      }

      return {
        success: true,
        message: `Plugin '${pluginName}' has been ${enabled ? 'enabled' : 'disabled'} in the database`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update plugin state: ' + error.message
      };
    }
  }

  /**
   * Update a plugin's settings
   */
  async updateSettings(pluginName, settings) {
    try {
      const result = await Plugin.findOneAndUpdate(
        { name: pluginName },
        { $set: { settings } },
        { returnDocument: 'after' }
      );

      if (!result) {
        return {
          success: false,
          error: `Plugin '${pluginName}' not found in database`
        };
      }

      return {
        success: true,
        message: `Plugin '${pluginName}' settings updated`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update plugin settings: ' + error.message
      };
    }
  }

  /**
   * Trigger graceful process restart
   */
  restartServer() {
    console.log('🔄 Super Admin requested server restart via Plugin Manager');

    // Give response time to flush before killing
    setTimeout(() => {
      // Send SIGTERM to our own process to trigger graceful shutdown
      process.kill(process.pid, 'SIGTERM');
    }, 1000);

    return { success: true, message: 'Server is restarting...' };
  }
}

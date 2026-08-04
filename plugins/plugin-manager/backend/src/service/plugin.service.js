let Plugin;
let globalRegistry;

export function initPluginService(registry) {
  globalRegistry = registry;
  const models = registry.getService('core:models');
  if (models && models.Plugin) {
    Plugin = models.Plugin;
  } else {
    throw new Error('core:models service not found in registry');
  }
}
export class PluginService {
  /**
   * Get all installed plugins and their status
   */
  async getPlugins() {
    try {
      const plugins = await Plugin.find(
        {},
        { name: 1, enabled: 1, version: 1, settings: 1, _id: 0 }
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

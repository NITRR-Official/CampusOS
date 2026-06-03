import { Plugin } from '../../../../backend/src/database/schemas/index.js';

export class PluginService {
  /**
   * Get all installed plugins and their status
   */
  async getPlugins() {
    try {
      const plugins = await Plugin.find(
        {},
        { name: 1, enabled: 1, version: 1, _id: 0 }
      ).lean();
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
        { new: true }
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

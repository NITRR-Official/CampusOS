import { ActivityLog } from '../schema/activity.model.js';

export function createActivityService(registry) {
  function _injectThemeColors(logs) {
    return logs.map((log) => {
      const meta = registry ? registry.getPluginMetadata(log.entityType) : null;
      return {
        ...log,
        themeColor:
          meta && meta.themeColor
            ? meta.themeColor
            : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
      };
    });
  }

  async function logActivity(payload) {
    try {
      const log = new ActivityLog(payload);
      await log.save();
      return log;
    } catch (error) {
      console.error('[ActivityService] Error saving activity log', error);
      throw error;
    }
  }

  async function getGlobalFeed({ limit = 50, skip = 0 }) {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return _injectThemeColors(logs);
  }

  async function getEntityFeed(entityId, { limit = 50, skip = 0 }) {
    const logs = await ActivityLog.find({ entityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return _injectThemeColors(logs);
  }

  async function getUserFeed(actorId, { limit = 50, skip = 0 }) {
    const logs = await ActivityLog.find({ actorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return _injectThemeColors(logs);
  }

  return {
    logActivity,
    getGlobalFeed,
    getEntityFeed,
    getUserFeed
  };
}

export default createActivityService;

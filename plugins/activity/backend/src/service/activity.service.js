import { ActivityLog } from '../schema/activity.model.js';

class ActivityService {
  /**
   * Log a new activity (usually called by the listener)
   */
  async logActivity(payload) {
    try {
      const log = new ActivityLog(payload);
      await log.save();
      return log;
    } catch (error) {
      console.error('[ActivityService] Error saving activity log', error);
    }
  }

  /**
   * Get global activity feed
   */
  async getGlobalFeed({ limit = 50, skip = 0 }) {
    return ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Get activity feed for a specific entity (e.g., a club)
   */
  async getEntityFeed(entityId, { limit = 50, skip = 0 }) {
    return ActivityLog.find({ entityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Get personal activity feed (actions performed by the user)
   */
  async getUserFeed(actorId, { limit = 50, skip = 0 }) {
    return ActivityLog.find({ actorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

export const activityService = new ActivityService();
export default activityService;

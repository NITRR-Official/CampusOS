import { activityService } from '../service/activity.service.js';

class ActivityController {
  async getGlobalFeed(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = parseInt(req.query.skip, 10) || 0;
      const feed = await activityService.getGlobalFeed({ limit, skip });
      res.status(200).json({ success: true, data: feed });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getEntityFeed(req, res) {
    try {
      const { entityId } = req.params;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = parseInt(req.query.skip, 10) || 0;
      const feed = await activityService.getEntityFeed(entityId, {
        limit,
        skip
      });
      res.status(200).json({ success: true, data: feed });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserFeed(req, res) {
    try {
      // In a real authenticated setup, req.user would be populated by the Auth middleware
      const actorId = req.user?.id || req.query.userId;
      if (!actorId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = parseInt(req.query.skip, 10) || 0;
      const feed = await activityService.getUserFeed(actorId, { limit, skip });
      res.status(200).json({ success: true, data: feed });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const activityController = new ActivityController();
export default activityController;

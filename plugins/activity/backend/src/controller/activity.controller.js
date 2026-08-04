export function createActivityController({ activityService }) {
  async function getGlobalFeed(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const skip = parseInt(req.query.skip, 10) || 0;
      const feed = await activityService.getGlobalFeed({ limit, skip });
      res.status(200).json({ success: true, data: feed });
    } catch (error) {
      next(error);
    }
  }

  async function getEntityFeed(req, res, next) {
    try {
      const { entityId } = req.params;
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const skip = parseInt(req.query.skip, 10) || 0;
      const feed = await activityService.getEntityFeed(entityId, {
        limit,
        skip
      });
      res.status(200).json({ success: true, data: feed });
    } catch (error) {
      next(error);
    }
  }

  async function getUserFeed(req, res, next) {
    try {
      const actorId = req.user?.id;
      if (!actorId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const skip = parseInt(req.query.skip, 10) || 0;
      const feed = await activityService.getUserFeed(actorId, { limit, skip });
      res.status(200).json({ success: true, data: feed });
    } catch (error) {
      next(error);
    }
  }

  return {
    getGlobalFeed,
    getEntityFeed,
    getUserFeed
  };
}

export default createActivityController;

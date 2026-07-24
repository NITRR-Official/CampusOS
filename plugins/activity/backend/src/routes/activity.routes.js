export function registerActivityRoutes(
  app,
  activityController,
  requirePermissions
) {
  // Keeping endpoints publicly accessible for the V1 dashboard,
  // but in prod they would be behind requirePermissions('audit:view')
  app.get('/api/v1/activity/global', activityController.getGlobalFeed);
  app.get('/api/v1/activity/me', activityController.getUserFeed);
  app.get(
    '/api/v1/activity/entity/:entityId',
    activityController.getEntityFeed
  );
}

export default registerActivityRoutes;

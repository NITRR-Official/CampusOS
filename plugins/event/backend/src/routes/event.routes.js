export function registerEventRoutes(
  app,
  eventController,
  requirePermissions,
  requireSuperAdmin
) {
  const manageEvents = requirePermissions('event:manage');
  const viewEvents = requirePermissions('event:view');

  if (requireSuperAdmin) {
    app.get(
      '/api/v1/admin/events',
      requireSuperAdmin,
      eventController.adminList
    );
  }

  app.get('/api/v1/events', viewEvents, eventController.list);
  app.get('/api/v1/events/public', eventController.listPublic);
  app.get('/api/v1/events/:eventId', viewEvents, eventController.getById);
  app.get('/api/v1/events/:eventId/public', eventController.getPublicById);
  app.post('/api/v1/events', eventController.create);
  app.patch('/api/v1/events/:eventId', manageEvents, eventController.update);
  app.post(
    '/api/v1/events/:eventId/publish',
    manageEvents,
    eventController.publish
  );
  app.post(
    '/api/v1/events/:eventId/unpublish',
    manageEvents,
    eventController.unpublish
  );
  app.post('/api/v1/events/:eventId/registrations', eventController.register);
  app.get(
    '/api/v1/events/:eventId/registrations',
    manageEvents,
    eventController.listRegistrations
  );
}

export default registerEventRoutes;

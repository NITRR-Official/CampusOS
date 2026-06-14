export function registerEventRoutes(
  app,
  eventController,
  requireRoles,
  requirePermissions
) {
  const managePermissions = requirePermissions || requireRoles;

  app.get('/api/v1/events', eventController.list);
  app.get('/api/v1/events/:eventId', eventController.getById);
  app.post(
    '/api/v1/events',
    managePermissions('event:create'),
    eventController.create
  );
  app.patch(
    '/api/v1/events/:eventId',
    managePermissions('event:manage'),
    eventController.update
  );
  app.post(
    '/api/v1/events/:eventId/publish',
    managePermissions('event:manage'),
    eventController.publish
  );
  app.post(
    '/api/v1/events/:eventId/unpublish',
    managePermissions('event:manage'),
    eventController.unpublish
  );
  app.post('/api/v1/events/:eventId/registrations', eventController.register);
  app.get(
    '/api/v1/events/:eventId/registrations',
    managePermissions('event:manage'),
    eventController.listRegistrations
  );
}

export default registerEventRoutes;

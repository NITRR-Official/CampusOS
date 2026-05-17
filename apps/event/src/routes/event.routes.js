export function registerEventRoutes(app, eventController, requireRoles) {
  const manageEvents = requireRoles('admin', 'coordinator');

  app.get('/api/v1/events', eventController.list);
  app.get('/api/v1/events/:eventId', eventController.getById);
  app.post('/api/v1/events', manageEvents, eventController.create);
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

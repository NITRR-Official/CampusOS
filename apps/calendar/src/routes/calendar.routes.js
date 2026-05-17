export function registerCalendarRoutes(app, calendarController, requireRoles) {
  const manageCalendar = requireRoles('admin', 'coordinator');

  app.get('/api/v1/calendar', calendarController.list);
  app.get('/api/v1/calendar/range', calendarController.queryByRange);
  app.get('/api/v1/calendar/:eventId', calendarController.getById);
  app.post('/api/v1/calendar', manageCalendar, calendarController.create);
  app.delete(
    '/api/v1/calendar/:eventId',
    manageCalendar,
    calendarController.deleteEvent
  );
}

export default registerCalendarRoutes;

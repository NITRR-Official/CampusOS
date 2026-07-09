export function registerCalendarRoutes(
  app,
  calendarController,
  requirePermissions
) {
  const manageCalendar = requirePermissions('calendar:manage');

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

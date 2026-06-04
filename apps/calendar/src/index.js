import { createCalendarController } from './controller/calendar.controller.js';
import { registerCalendarRoutes } from './routes/calendar.routes.js';

export async function init(app, registry, eventBus) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const calendarController = createCalendarController();
  registerCalendarRoutes(app, calendarController, requireRoles);

  registry.registerModule('calendar', {
    routes: [
      '/api/v1/calendar',
      '/api/v1/calendar/range',
      '/api/v1/calendar/:eventId'
    ]
  });
}

export default init;

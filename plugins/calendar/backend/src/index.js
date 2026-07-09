import { createCalendarController } from './controller/calendar.controller.js';
import { registerCalendarRoutes } from './routes/calendar.routes.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const calendarController = createCalendarController();
  registerCalendarRoutes(app, calendarController, requirePermissions);

  registry.registerModule('calendar', {
    routes: [
      '/api/v1/calendar',
      '/api/v1/calendar/range',
      '/api/v1/calendar/:eventId'
    ]
  });

  if (registry.permissions) {
    registry.permissions.register({
      id: 'calendar:manage',
      module: 'calendar',
      label: 'Manage Calendar',
      description: 'Allows scheduling cross-club events and resolving conflicts'
    });
  }
}

export default init;

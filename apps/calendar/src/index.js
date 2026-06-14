import { createCalendarController } from './controller/calendar.controller.js';
import { registerCalendarRoutes } from './routes/calendar.routes.js';

/**
 * Atomic permissions this module exposes. Registered with the core
 * PermissionRegistry so the platform (and super-admin UI) can discover them
 * without static coupling. Enforcement still happens via `requireRoles`.
 */
const CALENDAR_PERMISSIONS = [
  {
    id: 'calendar:create',
    description: 'Create calendar events',
    label: 'Create Calendar Event'
  },
  {
    id: 'calendar:read',
    description: 'View calendar events',
    label: 'View Calendar Events'
  },
  {
    id: 'calendar:update',
    description: 'Update calendar events',
    label: 'Update Calendar Event'
  },
  {
    id: 'calendar:delete',
    description: 'Delete calendar events',
    label: 'Delete Calendar Event'
  }
];

export async function init(app, registry, eventBus) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  // Register this module's atomic permissions in the core permission registry.
  if (
    registry.permissions &&
    typeof registry.permissions.register === 'function'
  ) {
    for (const permission of CALENDAR_PERMISSIONS) {
      registry.permissions.register({ ...permission, module: 'calendar' });
    }
  }

  const calendarController = createCalendarController({ eventBus });
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

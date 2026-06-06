import { createEventController } from './controller/event.controller.js';
import { registerEventRoutes } from './routes/event.routes.js';

export async function init(app, registry, eventBus) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const eventController = createEventController();
  registerEventRoutes(app, eventController, requireRoles);

  registry.registerModule('event', {
    routes: [
      '/api/v1/events',
      '/api/v1/events/:eventId',
      '/api/v1/events/:eventId/publish',
      '/api/v1/events/:eventId/unpublish',
      '/api/v1/events/:eventId/registrations'
    ]
  });

  // Register atomic permissions for RBAC
  if (registry.permissions) {
    registry.permissions.register({
      id: 'event:create',
      module: 'event',
      label: 'Create Events',
      description: 'Allows creating new events for a club'
    });
    registry.permissions.register({
      id: 'event:manage',
      module: 'event',
      label: 'Manage Events',
      description: 'Allows editing, publishing, and deleting events'
    });
  }
}

export default init;

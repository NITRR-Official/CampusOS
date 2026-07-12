import { createEventController } from './controller/event.controller.js';
import { registerEventRoutes } from './routes/event.routes.js';
import { createEventService } from './service/event.service.js';
import { createEventRepository } from './repository/event.repository.js';
import { Event } from './schema/event.model.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const eventRepository = createEventRepository();
  const eventService = createEventService(eventRepository, eventBus);
  const eventController = createEventController(eventService);
  registerEventRoutes(app, eventController, requirePermissions);

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
      id: 'event:view',
      module: 'event',
      label: 'View Events',
      description: 'Allows viewing event details'
    });
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

    registry.registerContextResolver('/api/v1/events', async (req) => {
      const eventId = req.params?.eventId || req.url.split('/')[4];
      // e.g. /api/v1/events/123/publish -> split gives ['', 'api', 'v1', 'events', '123']
      if (!eventId) return null;
      try {
        const EventModel = (await import('./schema/event.model.js')).Event;
        const eventDoc = await EventModel.findById(eventId)
          .select('clubId')
          .lean();
        return eventDoc?.clubId || null;
      } catch {
        return null;
      }
    });
  }

  if (eventBus) {
    eventBus.on('club:deleted', async (payload) => {
      if (payload && payload.clubId) {
        await eventService.deleteEventsByClub(payload.clubId);
      }
    });
  }
}

export default init;

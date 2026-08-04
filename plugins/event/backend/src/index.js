import { createEventController } from './controller/event.controller.js';
import { registerEventRoutes } from './routes/event.routes.js';
import { createEventService } from './service/event.service.js';
import { createEventRepository } from './repository/event.repository.js';
import { Event } from './schema/event.model.js';
import { EventRegistration } from './schema/event-registration.model.js';
import { registerEventHandlers } from './listeners/index.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');
  const requireSuperAdmin = registry.getService('requireSuperAdmin');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const eventRepository = createEventRepository();
  const eventService = createEventService(eventRepository, eventBus);
  const eventController = createEventController(eventService, registry);
  registerEventRoutes(
    app,
    eventController,
    requirePermissions,
    requireSuperAdmin
  );

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

    registry.registerPublicRoute(/^\/api\/v1\/events\/public$/, 'GET');
    registry.registerPublicRoute(/^\/api\/v1\/events\/[^/]+\/public$/, 'GET');
    registry.registerPublicRoute(
      /^\/api\/v1\/events\/[^/]+\/registrations$/,
      'POST'
    );

    registry.registerContextResolver('/api/v1/events', async (req) => {
      if (req.method === 'POST' && req.body?.clubId) {
        return { type: 'club:member_service', id: req.body.clubId };
      }

      const eventId = req.params?.eventId || req.url.split('/')[4];
      // e.g. /api/v1/events/123/publish -> split gives ['', 'api', 'v1', 'events', '123']
      if (!eventId) return null;
      try {
        const EventModel = (await import('./schema/event.model.js')).Event;
        const eventDoc = await EventModel.findById(eventId)
          .select('clubId')
          .lean();
        return eventDoc?.clubId
          ? { type: 'club:member_service', id: eventDoc.clubId.toString() }
          : null;
      } catch {
        return null;
      }
    });
  }

  if (eventBus) {
    registerEventHandlers(eventBus, registry, eventService);
  }

  // Register Stat Provider for Global Dashboard
  registry.registerStatProvider('event', async (user) => {
    try {
      if (!user || !user.email) return { events: 0 };

      // If the user is a super admin, show global stats
      if (user.isSuperAdmin) {
        const eventsCount = await Event.countDocuments({ status: 'published' });
        return { events: eventsCount };
      }

      // Get events the user has registered for (assuming attendeeEmail matches user.email)
      const registrations = await EventRegistration.find({
        attendeeEmail: user.email.toLowerCase()
      })
        .select('eventId')
        .lean();

      const eventIds = registrations.map((r) => r.eventId);

      const eventsCount = await Event.countDocuments({
        _id: { $in: eventIds },
        status: 'published'
      });
      return { events: eventsCount };
    } catch (err) {
      console.error('Error fetching event stats:', err);
      return { events: 0 };
    }
  });
}

export default init;

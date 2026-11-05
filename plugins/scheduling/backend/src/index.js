/**
 * Scheduling Plugin
 * Handles resource and venue scheduling with conflict detection
 */

import { registerSchedulingRoutes } from './routes/scheduling.routes.js';
import { createSchedulingService } from './service/scheduling.service.js';
import { createSchedulingController } from './controller/scheduling.controller.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const schedulingService = createSchedulingService();
  const schedulingController = createSchedulingController(schedulingService);

  registerSchedulingRoutes(app, schedulingController, requirePermissions);

  registry.registerModule('scheduling', {
    routes: [
      'POST /api/v1/events/:eventId/schedule',
      'GET /api/v1/events/:eventId/schedule',
      'GET /api/v1/schedule/:slotId',
      'PUT /api/v1/schedule/:slotId',
      'DELETE /api/v1/schedule/:slotId',
      'GET /api/v1/schedule/conflicts',
      'GET /api/v1/schedule/:slotId/conflicts',
      'PUT /api/v1/schedule/conflicts/:conflictId/resolve',
      'GET /api/v1/schedule/venue/:venue/available',
      'GET /api/v1/events/:eventId/schedule/overview'
    ]
  });

  registry.permissions.register({
    id: 'scheduling:manage',
    module: 'scheduling',
    label: 'Manage Schedules',
    description: 'Allows managing timelines, milestones, and project phases'
  });

  registry.registerContextResolver('/api/v1/schedule', async (req) => {
    const slotId = req.params?.slotId || req.path.split('/')[4]?.split('?')[0];
    if (!slotId || slotId === 'conflicts' || slotId === 'venue') return null;
    try {
      const { ScheduleSlot } = await import('./schema/scheduleSlot.model.js');
      const slotDoc = await ScheduleSlot.findById(slotId)
        .select('clubId')
        .lean();
      return slotDoc?.clubId
        ? { type: 'club:member_service', id: slotDoc.clubId.toString() }
        : null;
    } catch {
      return null;
    }
  });

  if (eventBus) {
    eventBus.on('club:deleted', async (payload) => {
      try {
        if (payload && payload.clubId && registry) {
          const eventService = registry?.getService
            ? registry.getService('event:service')
            : null;
          if (eventService) {
            const events = await eventService.listEvents(payload.clubId);
            if (Array.isArray(events)) {
              for (const ev of events) {
                await schedulingService.deleteEventSchedule(ev._id || ev.id);
              }
            }
          }
        }
      } catch (err) {
        console.error(
          '[Scheduling Listener] Error handling club:deleted event:',
          err
        );
      }
    });

    eventBus.on('event:deleted', async (payload) => {
      try {
        if (payload && payload.eventId) {
          await schedulingService.deleteEventSchedule(payload.eventId);
        }
      } catch (err) {
        console.error(
          '[Scheduling Listener] Error handling event:deleted event:',
          err
        );
      }
    });
  }
}

export default init;

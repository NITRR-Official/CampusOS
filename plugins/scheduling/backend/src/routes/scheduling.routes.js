/**
 * Scheduling Routes
 * Registers scheduling and time slot endpoints with Express
 */

import schedulingController from '../controller/scheduling.controller.js';

export function registerSchedulingRoutes(app, requirePermissions) {
  // Create time slot (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/schedule',
    requirePermissions('scheduling:manage'),
    schedulingController.createTimeSlot
  );

  // Get event schedule
  app.get(
    '/api/v1/events/:eventId/schedule',
    schedulingController.getEventSchedule
  );

  // Get time slot details
  app.get('/api/v1/schedule/:slotId', schedulingController.getTimeSlot);

  // Update time slot (admin/coordinator only)
  app.put(
    '/api/v1/schedule/:slotId',
    requirePermissions('scheduling:manage'),
    schedulingController.updateTimeSlot
  );

  // Delete time slot (admin/coordinator only)
  app.delete(
    '/api/v1/schedule/:slotId',
    requirePermissions('scheduling:manage'),
    schedulingController.deleteTimeSlot
  );

  // Get all conflicts
  app.get('/api/v1/schedule/conflicts', schedulingController.getAllConflicts);

  // Get conflicts for slot
  app.get(
    '/api/v1/schedule/:slotId/conflicts',
    schedulingController.getSlotConflicts
  );

  // Resolve conflict (admin/coordinator only)
  app.put(
    '/api/v1/schedule/conflicts/:conflictId/resolve',
    requirePermissions('scheduling:manage'),
    schedulingController.resolveConflict
  );

  // Check venue availability
  app.get(
    '/api/v1/schedule/venue/:venue/available',
    schedulingController.checkVenueAvailability
  );

  // Get schedule overview
  app.get(
    '/api/v1/events/:eventId/schedule/overview',
    schedulingController.getScheduleOverview
  );
}

export default registerSchedulingRoutes;

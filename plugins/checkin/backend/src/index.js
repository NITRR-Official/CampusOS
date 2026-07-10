/**
 * Check-in Plugin
 * Handles event attendance tracking and QR code generation
 */

import { registerCheckInRoutes } from './routes/checkin.routes.js';
import { createCheckInController } from './controller/checkin.controller.js';
import { createCheckInService } from './service/checkin.service.js';
import { createCheckInRepository } from './repository/checkin.repository.js';
import { CheckIn } from './schema/checkin.model.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const checkInRepository = createCheckInRepository();
  const checkInService = createCheckInService(checkInRepository);
  const checkInController = createCheckInController(checkInService);

  registerCheckInRoutes(app, checkInController, requirePermissions);

  registry.registerModule('checkin', {
    routes: [
      'GET /api/v1/events/:eventId/checkins',
      'POST /api/v1/events/:eventId/checkins',
      'GET /api/v1/events/:eventId/checkins/status/:userId',
      'POST /api/v1/checkins/scan',
      'GET /api/v1/events/:eventId/attendance-stats'
    ]
  });

  if (registry.permissions) {
    registry.permissions.register({
      id: 'checkin:manage',
      module: 'checkin',
      label: 'Manage Check-ins',
      description: 'Allows scanning QR codes and managing attendance'
    });
  }

  if (eventBus) {
    eventBus.on('event:deleted', async (payload) => {
      if (payload && payload.eventId) {
        await checkInService.deleteEventCheckIns(payload.eventId);
      }
    });
  }
}

export default init;

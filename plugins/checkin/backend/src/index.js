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

  // Public/self route to scan attendance QR codes
  registry.registerPublicRoute(/^\/api\/v1\/checkins\/scan$/, 'POST');
  registry.registerPublicRoute(
    /^\/api\/v1\/events\/[^/]+\/checkins\/status\/[^/]+$/,
    'GET'
  );

  if (eventBus) {
    eventBus.on('event:deleted', async (payload) => {
      try {
        if (payload && payload.eventId) {
          await checkInService.deleteEventCheckIns(payload.eventId);
        }
      } catch (err) {
        console.error(
          '[CheckIn Listener] Error handling event:deleted event:',
          err
        );
      }
    });

    eventBus.on('user:deleted', async (payload) => {
      try {
        if (payload && payload.userId) {
          await checkInService.deleteUserCheckIns(payload.userId);
        }
      } catch (err) {
        console.error(
          '[CheckIn Listener] Error handling user:deleted event:',
          err
        );
      }
    });

    eventBus.on('event:registered', async (payload) => {
      try {
        if (payload && payload.eventId && payload.userId) {
          await checkInService.createCheckIn(payload.eventId, payload.userId);
        }
      } catch (err) {
        // If check-in record already exists, duplicate key error (code 11000) can be safely ignored
        if (err?.code !== 11000) {
          console.error(
            '[CheckIn Listener] Error handling event:registered event:',
            err
          );
        }
      }
    });
  }
}

export default init;

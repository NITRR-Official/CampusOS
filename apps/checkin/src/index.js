/**
 * Check-in Plugin
 * Handles event attendance tracking and QR code generation
 */

import { registerCheckInRoutes } from './routes/checkin.routes.js';

export async function init(app, registry, eventBus) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerCheckInRoutes(app, requireRoles);

  registry.registerModule('checkin', {
    routes: [
      'GET /api/v1/events/:eventId/checkins',
      'POST /api/v1/events/:eventId/checkins',
      'GET /api/v1/events/:eventId/checkins/status/:userId',
      'POST /api/v1/checkins/scan',
      'GET /api/v1/events/:eventId/attendance-stats'
    ]
  });
}

export default init;

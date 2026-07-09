/**
 * Check-in Plugin
 * Handles event attendance tracking and QR code generation
 */

import { registerCheckInRoutes } from './routes/checkin.routes.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerCheckInRoutes(app, requirePermissions);

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
}

export default init;

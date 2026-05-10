/**
 * Scheduling Plugin
 * Handles resource and venue scheduling with conflict detection
 */

import { registerSchedulingRoutes } from './routes/scheduling.routes.js';

export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerSchedulingRoutes(app, requireRoles);

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
}

export default init;

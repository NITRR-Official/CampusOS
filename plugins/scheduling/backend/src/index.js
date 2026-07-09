/**
 * Scheduling Plugin
 * Handles resource and venue scheduling with conflict detection
 */

import { registerSchedulingRoutes } from './routes/scheduling.routes.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerSchedulingRoutes(app, requirePermissions);

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

  if (registry.permissions) {
    registry.permissions.register({
      id: 'scheduling:manage',
      module: 'scheduling',
      label: 'Manage Schedules',
      description: 'Allows managing timelines, milestones, and project phases'
    });
  }
}

export default init;

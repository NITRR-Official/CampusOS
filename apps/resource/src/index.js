/**
 * Resource Plugin
 * Handles equipment and resource management for events
 */

import { registerResourceRoutes } from './routes/resource.routes.js';

export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerResourceRoutes(app, requireRoles);

  registry.registerModule('resource', {
    routes: [
      'POST /api/v1/resources',
      'GET /api/v1/resources',
      'GET /api/v1/resources/available',
      'GET /api/v1/resources/:resourceId',
      'PUT /api/v1/resources/:resourceId',
      'DELETE /api/v1/resources/:resourceId',
      'POST /api/v1/events/:eventId/resources/:resourceId',
      'GET /api/v1/events/:eventId/resources',
      'GET /api/v1/resources/:resourceId/allocations',
      'PUT /api/v1/resources/allocations/:allocationId/status',
      'PUT /api/v1/resources/:resourceId/maintenance'
    ]
  });
}

export default init;

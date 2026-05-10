/**
 * Vendor Plugin
 * Handles vendor and supplier management for events
 */

import { registerVendorRoutes } from './routes/vendor.routes.js';

export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerVendorRoutes(app, requireRoles);

  registry.registerModule('vendor', {
    routes: [
      'POST /api/v1/vendors',
      'GET /api/v1/vendors',
      'GET /api/v1/vendors/:vendorId',
      'PUT /api/v1/vendors/:vendorId',
      'DELETE /api/v1/vendors/:vendorId',
      'POST /api/v1/events/:eventId/vendors/:vendorId',
      'GET /api/v1/events/:eventId/vendors',
      'GET /api/v1/vendors/:vendorId/assignments',
      'PUT /api/v1/vendors/assignments/:assignmentId/status',
      'POST /api/v1/vendors/:vendorId/rate'
    ]
  });
}

export default init;

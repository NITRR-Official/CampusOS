/**
 * Vendor Routes
 * Registers vendor management endpoints with Express
 */

import vendorController from '../controller/vendor.controller.js';

export function registerVendorRoutes(app, requirePermissions) {
  const viewVendor = requirePermissions('vendor:view');
  // Create vendor (admin/coordinator only)
  app.post(
    '/api/v1/vendors',
    requirePermissions('vendor:manage'),
    vendorController.createVendor
  );

  // List all vendors
  app.get('/api/v1/vendors', viewVendor, vendorController.listVendors);

  // Get vendor by ID
  app.get('/api/v1/vendors/:vendorId', viewVendor, vendorController.getVendor);

  // Update vendor (admin/coordinator only)
  app.put(
    '/api/v1/vendors/:vendorId',
    requirePermissions('vendor:manage'),
    vendorController.updateVendor
  );

  // Delete vendor (admin only)
  app.delete(
    '/api/v1/vendors/:vendorId',
    requirePermissions('vendor:manage'),
    vendorController.deleteVendor
  );

  // Assign vendor to event (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/vendors/:vendorId',
    requirePermissions('vendor:manage'),
    vendorController.assignVendorToEvent
  );

  // Get vendors for event
  app.get(
    '/api/v1/events/:eventId/vendors',
    viewVendor,
    vendorController.getEventVendors
  );

  // Get assignments for vendor
  app.get(
    '/api/v1/vendors/:vendorId/assignments',
    viewVendor,
    vendorController.getVendorAssignments
  );

  // Update assignment status (admin/coordinator only)
  app.put(
    '/api/v1/vendors/assignments/:assignmentId/status',
    requirePermissions('vendor:manage'),
    vendorController.updateAssignmentStatus
  );

  // Rate vendor
  app.post('/api/v1/vendors/:vendorId/rate', vendorController.rateVendor);
}

export default registerVendorRoutes;

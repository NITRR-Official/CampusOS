/**
 * Vendor Routes
 * Registers vendor management endpoints with Express
 */

import vendorController from '../controller/vendor.controller.js';

export function registerVendorRoutes(app, requireRoles) {
  // Create vendor (admin/coordinator only)
  app.post(
    '/api/v1/vendors',
    requireRoles('admin', 'coordinator'),
    vendorController.createVendor
  );

  // List all vendors
  app.get('/api/v1/vendors', vendorController.listVendors);

  // Get vendor by ID
  app.get('/api/v1/vendors/:vendorId', vendorController.getVendor);

  // Update vendor (admin/coordinator only)
  app.put(
    '/api/v1/vendors/:vendorId',
    requireRoles('admin', 'coordinator'),
    vendorController.updateVendor
  );

  // Delete vendor (admin only)
  app.delete(
    '/api/v1/vendors/:vendorId',
    requireRoles('admin'),
    vendorController.deleteVendor
  );

  // Assign vendor to event (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/vendors/:vendorId',
    requireRoles('admin', 'coordinator'),
    vendorController.assignVendorToEvent
  );

  // Get vendors for event
  app.get('/api/v1/events/:eventId/vendors', vendorController.getEventVendors);

  // Get assignments for vendor
  app.get(
    '/api/v1/vendors/:vendorId/assignments',
    vendorController.getVendorAssignments
  );

  // Update assignment status (admin/coordinator only)
  app.put(
    '/api/v1/vendors/assignments/:assignmentId/status',
    requireRoles('admin', 'coordinator'),
    vendorController.updateAssignmentStatus
  );

  // Rate vendor
  app.post('/api/v1/vendors/:vendorId/rate', vendorController.rateVendor);
}

export default registerVendorRoutes;

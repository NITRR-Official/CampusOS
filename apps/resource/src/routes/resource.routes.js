/**
 * Resource Routes
 * Registers resource management endpoints with Express
 */

import resourceController from '../controller/resource.controller.js';

export function registerResourceRoutes(app, requireRoles) {
  // Create resource (admin/coordinator only)
  app.post(
    '/api/v1/resources',
    requireRoles('admin', 'coordinator'),
    resourceController.createResource
  );

  // List all resources
  app.get('/api/v1/resources', resourceController.listResources);

  // Get available resources
  app.get(
    '/api/v1/resources/available',
    resourceController.getAvailableResources
  );

  // Get resource by ID
  app.get('/api/v1/resources/:resourceId', resourceController.getResource);

  // Update resource (admin/coordinator only)
  app.put(
    '/api/v1/resources/:resourceId',
    requireRoles('admin', 'coordinator'),
    resourceController.updateResource
  );

  // Delete resource (admin only)
  app.delete(
    '/api/v1/resources/:resourceId',
    requireRoles('admin'),
    resourceController.deleteResource
  );

  // Allocate resource to event (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/resources/:resourceId',
    requireRoles('admin', 'coordinator'),
    resourceController.allocateResourceToEvent
  );

  // Get resources for event
  app.get(
    '/api/v1/events/:eventId/resources',
    resourceController.getEventResources
  );

  // Get allocations for resource
  app.get(
    '/api/v1/resources/:resourceId/allocations',
    resourceController.getResourceAllocations
  );

  // Update allocation status (admin/coordinator only)
  app.put(
    '/api/v1/resources/allocations/:allocationId/status',
    requireRoles('admin', 'coordinator'),
    resourceController.updateAllocationStatus
  );

  // Update maintenance date (admin only)
  app.put(
    '/api/v1/resources/:resourceId/maintenance',
    requireRoles('admin'),
    resourceController.updateMaintenance
  );
}

export default registerResourceRoutes;

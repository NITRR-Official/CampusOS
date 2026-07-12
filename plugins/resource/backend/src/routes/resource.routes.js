/**
 * Resource Routes
 * Registers resource management endpoints with Express
 */

import resourceController from '../controller/resource.controller.js';

export function registerResourceRoutes(app, requirePermissions) {
  const viewResource = requirePermissions('resource:view');
  // Create resource (admin/coordinator only)
  app.post(
    '/api/v1/resources',
    requirePermissions('resource:manage'),
    resourceController.createResource
  );

  // List all resources
  app.get('/api/v1/resources', viewResource, resourceController.listResources);

  // Get available resources
  app.get(
    '/api/v1/resources/available',
    viewResource,
    resourceController.getAvailableResources
  );

  // Get resource by ID
  app.get(
    '/api/v1/resources/:resourceId',
    viewResource,
    resourceController.getResource
  );

  // Update resource (admin/coordinator only)
  app.put(
    '/api/v1/resources/:resourceId',
    requirePermissions('resource:manage'),
    resourceController.updateResource
  );

  // Delete resource (admin only)
  app.delete(
    '/api/v1/resources/:resourceId',
    requirePermissions('resource:manage'),
    resourceController.deleteResource
  );

  // Allocate resource to event (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/resources/:resourceId',
    requirePermissions('resource:manage'),
    resourceController.allocateResourceToEvent
  );

  // Get resources for event
  app.get(
    '/api/v1/events/:eventId/resources',
    viewResource,
    resourceController.getEventResources
  );

  // Get allocations for resource
  app.get(
    '/api/v1/resources/:resourceId/allocations',
    viewResource,
    resourceController.getResourceAllocations
  );

  // Update allocation status (admin/coordinator only)
  app.put(
    '/api/v1/resources/allocations/:allocationId/status',
    requirePermissions('resource:manage'),
    resourceController.updateAllocationStatus
  );

  // Update maintenance date (admin only)
  app.put(
    '/api/v1/resources/:resourceId/maintenance',
    requirePermissions('resource:manage'),
    resourceController.updateMaintenance
  );
}

export default registerResourceRoutes;

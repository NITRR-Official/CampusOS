/**
 * Resource Plugin
 * Handles equipment and resource management for events
 */

import { registerResourceRoutes } from './routes/resource.routes.js';
import ResourceService from './service/resource.service.js';
import { registerResourceHandlers } from './listeners/index.js';

import resourceController from './controller/resource.controller.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  if (eventBus) {
    resourceController.setEventBus(eventBus);
  }

  registerResourceRoutes(app, requirePermissions);

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

  if (registry.permissions) {
    registry.permissions.register({
      id: 'resource:view',
      module: 'resource',
      label: 'View Resources',
      description: 'Allows viewing resource bookings'
    });
    registry.permissions.register({
      id: 'resource:manage',
      module: 'resource',
      label: 'Manage Resources',
      description: 'Allows allocating and tracking resources and inventory'
    });
  }

  registry.registerContextResolver('/api/v1/resources', async (req) => {
    const resourceId = req.params?.resourceId || req.url.split('/')[4];
    if (
      !resourceId ||
      resourceId === 'available' ||
      resourceId === 'allocations'
    )
      return null;
    try {
      const ResourceModel = (await import('./schema/resource.model.js'))
        .Resource;
      const resDoc = await ResourceModel.findById(resourceId)
        .select('clubId')
        .lean();
      return resDoc?.clubId
        ? { type: 'clubService', id: resDoc.clubId.toString() }
        : null;
    } catch {
      return null;
    }
  });

  if (eventBus) {
    const resourceService = new ResourceService();
    registerResourceHandlers(eventBus, registry, resourceService);
  }
}

export default init;

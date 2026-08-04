import {
  createResourceSchema,
  updateResourceSchema,
  allocateResourceSchema,
  updateAllocationStatusSchema,
  updateMaintenanceSchema
} from '../schema/resource.schema.js';

/**
 * Resource Controller Factory
 * HTTP request handlers for resource operations
 */

export function createResourceController(resourceService) {
  return {
    setEventBus(eventBus) {
      resourceService.setEventBus(eventBus);
    },

    /**
     * POST /api/v1/resources
     * Create a new resource (admin/coordinator only)
     */
    async createResource(req, res, next) {
      try {
        const value = createResourceSchema.parse(req.body);
        const resource = await resourceService.createResource(value);
        return res.status(201).json(resource);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/resources
     * List all resources with optional filters
     */
    async listResources(req, res, next) {
      try {
        const { type, status, condition } = req.query;
        const filters = {};

        if (type) filters.type = type;
        if (status) filters.status = status;
        if (condition) filters.condition = condition;

        const resources = await resourceService.getAllResources(filters);
        return res.status(200).json({
          count: resources.length,
          resources
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/resources/available
     * List available resources
     */
    async getAvailableResources(req, res, next) {
      try {
        const { type, status, condition } = req.query;
        const filters = {};

        if (type) filters.type = type;
        if (status) filters.status = status;
        if (condition) filters.condition = condition;

        const resources = await resourceService.getAvailableResources(filters);
        return res.status(200).json({
          count: resources.length,
          resources
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/resources/:resourceId
     * Get resource details by ID
     */
    async getResource(req, res, next) {
      try {
        const { resourceId } = req.params;
        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId is required' });
        }

        const resource = await resourceService.getResourceById(resourceId);
        if (!resource) {
          return res.status(404).json({ error: 'Resource not found' });
        }

        return res.status(200).json(resource);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * PUT /api/v1/resources/:resourceId
     * Update resource information (admin/coordinator only)
     */
    async updateResource(req, res, next) {
      try {
        const { resourceId } = req.params;
        const updateData = updateResourceSchema.parse(req.body);

        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId is required' });
        }

        const resource = await resourceService.updateResource(
          resourceId,
          updateData
        );
        return res.status(200).json(resource);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * DELETE /api/v1/resources/:resourceId
     * Delete a resource (admin only)
     */
    async deleteResource(req, res, next) {
      try {
        const { resourceId } = req.params;
        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId is required' });
        }

        const result = await resourceService.deleteResource(resourceId);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * POST /api/v1/events/:eventId/resources/:resourceId
     * Allocate resource to event (admin/coordinator only)
     */
    async allocateResourceToEvent(req, res, next) {
      try {
        const { eventId, resourceId } = req.params;
        const value = allocateResourceSchema.parse(req.body);

        if (!eventId || !resourceId) {
          return res
            .status(400)
            .json({ error: 'eventId and resourceId are required' });
        }

        const allocation = await resourceService.allocateResourceToEvent(
          eventId,
          resourceId,
          value
        );
        return res.status(201).json(allocation);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/events/:eventId/resources
     * Get all resources allocated to an event
     */
    async getEventResources(req, res, next) {
      try {
        const { eventId } = req.params;
        if (!eventId) {
          return res.status(400).json({ error: 'eventId is required' });
        }

        const resources = await resourceService.getEventResources(eventId);
        return res.status(200).json({
          eventId,
          count: resources.length,
          resources
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/resources/:resourceId/allocations
     * Get all allocations for a resource
     */
    async getResourceAllocations(req, res, next) {
      try {
        const { resourceId } = req.params;
        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId is required' });
        }

        const allocations =
          await resourceService.getResourceAllocations(resourceId);
        return res.status(200).json({
          resourceId,
          count: allocations.length,
          allocations
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * PUT /api/v1/resources/allocations/:allocationId/status
     * Update allocation status (admin/coordinator only)
     */
    async updateAllocationStatus(req, res, next) {
      try {
        const { allocationId } = req.params;
        const { status } = updateAllocationStatusSchema.parse(req.body);

        if (!allocationId) {
          return res.status(400).json({ error: 'allocationId is required' });
        }

        const allocation = await resourceService.updateAllocationStatus(
          allocationId,
          status
        );
        return res.status(200).json(allocation);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * PUT /api/v1/resources/:resourceId/maintenance
     * Update resource maintenance date (admin only)
     */
    async updateMaintenance(req, res, next) {
      try {
        const { resourceId } = req.params;
        const { maintenanceDate } = updateMaintenanceSchema.parse(req.body);

        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId is required' });
        }

        const resource = await resourceService.updateMaintenance(
          resourceId,
          maintenanceDate
        );
        return res.status(200).json(resource);
      } catch (error) {
        return next(error);
      }
    }
  };
}

export default createResourceController;

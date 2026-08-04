import { AppError } from '@campus-os/shared/errors';

/**
 * Resource Service
 * Manages equipment and resources, allocations, and availability
 */

function normalizeAllocation(allocation, resourceId) {
  if (!allocation) {
    return null;
  }

  const allocationId =
    allocation.allocationId || allocation.id || allocation._id;
  const createdAt = allocation.createdAt || allocation.allocatedAt || null;
  const updatedAt = allocation.updatedAt || allocation.allocatedAt || null;

  return {
    id: allocationId,
    eventId: allocation.eventId,
    resourceId,
    allocatedQuantity: allocation.allocatedQuantity,
    startDate: allocation.startDate,
    endDate: allocation.endDate,
    notes: allocation.notes ?? null,
    status: allocation.status,
    createdAt,
    updatedAt
  };
}

function normalizeResource(resourceDoc) {
  if (!resourceDoc) {
    return null;
  }

  const resource = resourceDoc.toObject
    ? resourceDoc.toObject()
    : { ...resourceDoc };
  const resourceId = resource.id || resource._id;

  resource.id = resourceId;
  delete resource._id;

  if (Array.isArray(resource.allocations)) {
    resource.allocations = resource.allocations
      .map((allocation) => normalizeAllocation(allocation, resourceId))
      .filter(Boolean);
  }

  return resource;
}

export function createResourceService(resourceRepository) {
  let eventBus = null;

  return {
    setEventBus(eb) {
      eventBus = eb;
    },

    /**
     * Create a new resource
     */
    async createResource(resourceData) {
      const { name, type, quantity, description, location, owner, cost } =
        resourceData;

      const resource = await resourceRepository.create({
        name,
        type,
        quantity,
        availableQuantity: quantity,
        description: description || null,
        location: location || null,
        owner: owner || null,
        cost: cost || null,
        condition: 'good',
        maintenanceDate: null,
        status: 'available'
      });

      const serialized = normalizeResource(resource);
      if (eventBus) {
        eventBus.emit('resource:created', {
          resourceId: serialized.id,
          data: serialized
        });
      }
      return serialized;
    },

    /**
     * Get resource by ID
     */
    async getResourceById(resourceId) {
      const resource = await resourceRepository.findById(resourceId);
      if (!resource) return null;
      return normalizeResource(resource);
    },

    /**
     * Get all resources
     */
    async getAllResources(filters = {}) {
      const query = {};
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.condition) query.condition = filters.condition;

      const resources = await resourceRepository.find(query);
      return resources.map((resource) => normalizeResource(resource));
    },

    /**
     * Get available resources
     */
    async getAvailableResources(filters = {}) {
      const query = { availableQuantity: { $gt: 0 } };
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.condition) query.condition = filters.condition;

      const resources = await resourceRepository.find(query);
      return resources.map((resource) => normalizeResource(resource));
    },

    /**
     * Update resource information
     */
    async updateResource(resourceId, updateData) {
      const resource = await resourceRepository.updateById(resourceId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!resource) {
        throw new AppError('Resource not found', 404, 'NOT_FOUND');
      }

      return normalizeResource(resource);
    },

    /**
     * Delete resource
     */
    async deleteResource(resourceId) {
      const resource = await resourceRepository.deleteById(resourceId);
      if (!resource) {
        throw new AppError('Resource not found', 404, 'NOT_FOUND');
      }
      return { success: true, message: 'Resource deleted successfully' };
    },

    /**
     * Check for conflicting allocations
     */
    async checkAllocationConflicts(resourceId, startDate, endDate) {
      const resource =
        typeof resourceId === 'string'
          ? await resourceRepository.findById(resourceId)
          : resourceId;

      if (!resource) return [];

      const start = new Date(startDate);
      const end = new Date(endDate);

      return (resource.allocations || [])
        .filter((allocation) => {
          if (
            allocation.status === 'returned' ||
            allocation.status === 'damaged'
          ) {
            return false;
          }
          return !(end <= allocation.startDate || start >= allocation.endDate);
        })
        .map((allocation) =>
          normalizeAllocation(allocation, resource.id || resource._id)
        )
        .filter(Boolean);
    },

    /**
     * Allocate resource to event
     */
    async allocateResourceToEvent(eventId, resourceId, allocationData = {}) {
      if (!eventId || !resourceId) {
        throw new AppError(
          'eventId and resourceId are required',
          400,
          'VALIDATION_ERROR'
        );
      }

      const { allocatedQuantity, startDate, endDate, notes } = allocationData;

      const resource = await resourceRepository.findDocumentById(resourceId);
      if (!resource) {
        throw new AppError('Resource not found', 404, 'NOT_FOUND');
      }

      if (allocatedQuantity > resource.availableQuantity) {
        throw new AppError(
          `Insufficient availability. Available: ${resource.availableQuantity}, Requested: ${allocatedQuantity}`,
          400,
          'BAD_REQUEST'
        );
      }

      const conflicts = await this.checkAllocationConflicts(
        resource,
        startDate,
        endDate
      );
      if (conflicts.length > 0) {
        throw new AppError(
          'Resource is already allocated during this period',
          400,
          'BAD_REQUEST',
          { conflicts }
        );
      }

      const now = new Date();
      const allocation = {
        allocationId: crypto.randomUUID(),
        eventId,
        allocatedQuantity,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes: notes || null,
        status: 'allocated',
        allocatedAt: now,
        createdAt: now,
        updatedAt: now
      };

      resource.allocations.push(allocation);
      resource.availableQuantity -= allocatedQuantity;
      resource.updatedAt = now;

      await resourceRepository.saveDocument(resource);

      const serialized = normalizeAllocation(allocation, resourceId);
      if (eventBus) {
        eventBus.emit('resource:allocated', {
          resourceId,
          eventId,
          allocationId: serialized.id,
          data: serialized
        });
      }
      return serialized;
    },

    /**
     * Get allocations for event
     */
    async getEventResources(eventId) {
      const resources = await resourceRepository.find({
        'allocations.eventId': eventId
      });

      return resources.flatMap((resource) =>
        (resource.allocations || [])
          .filter((allocation) => allocation.eventId === eventId)
          .map((allocation) => ({
            ...normalizeAllocation(allocation, resource._id),
            resourceDetails: {
              id: resource._id,
              name: resource.name,
              type: resource.type,
              availableQuantity: resource.availableQuantity,
              location: resource.location,
              condition: resource.condition
            }
          }))
      );
    },

    /**
     * Delete all allocations for an event
     */
    async deleteEventAllocations(eventId) {
      const resources = await resourceRepository.findDocuments({
        'allocations.eventId': eventId
      });

      for (const resource of resources) {
        const removedAllocations = resource.allocations.filter(
          (allocation) =>
            allocation.eventId === eventId && allocation.status !== 'returned'
        );

        const quantityToRestore = removedAllocations.reduce(
          (total, allocation) => total + allocation.allocatedQuantity,
          0
        );

        resource.availableQuantity += quantityToRestore;

        resource.allocations = resource.allocations.filter(
          (allocation) => allocation.eventId !== eventId
        );

        await resourceRepository.saveDocument(resource);
      }
      return { success: true };
    },

    /**
     * Get allocations for resource
     */
    async getResourceAllocations(resourceId) {
      const resource = await resourceRepository.findById(resourceId);
      if (!resource) return [];

      return (resource.allocations || [])
        .map((allocation) => normalizeAllocation(allocation, resourceId))
        .filter(Boolean);
    },

    /**
     * Update allocation status
     */
    async updateAllocationStatus(allocationId, newStatus) {
      const validStatuses = ['allocated', 'in-use', 'returned', 'damaged'];
      if (!validStatuses.includes(newStatus)) {
        throw new AppError(
          `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          400,
          'VALIDATION_ERROR'
        );
      }

      const resource = await resourceRepository.findOneDocument({
        'allocations.allocationId': allocationId
      });
      if (!resource) {
        throw new AppError('Allocation not found', 404, 'NOT_FOUND');
      }

      const allocation = resource.allocations.find(
        (item) => item.allocationId === allocationId
      );
      if (!allocation) {
        throw new AppError('Allocation not found', 404, 'NOT_FOUND');
      }

      const previousStatus = allocation.status;
      allocation.status = newStatus;
      allocation.updatedAt = new Date();

      if (previousStatus !== 'returned' && newStatus === 'returned') {
        resource.availableQuantity += allocation.allocatedQuantity;
      }

      await resourceRepository.saveDocument(resource);

      return normalizeAllocation(allocation, resource.id || resource._id);
    },

    /**
     * Update resource maintenance date
     */
    async updateMaintenance(resourceId, maintenanceDate) {
      const maintenance = new Date(maintenanceDate);
      const resource = await resourceRepository.updateById(resourceId, {
        maintenanceDate: maintenance,
        lastMaintenanceDate: maintenance,
        updatedAt: new Date()
      });

      if (!resource) {
        throw new AppError('Resource not found', 404, 'NOT_FOUND');
      }

      return normalizeResource(resource);
    }
  };
}

export default createResourceService;

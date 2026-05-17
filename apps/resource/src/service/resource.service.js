import crypto from 'crypto';
import { Resource } from '../../../../backend/src/database/schemas/resource.schema.js';

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

export class ResourceService {
  /**
   * Create a new resource
   * @param {object} resourceData - Resource information
   * @returns {object} Created resource record
   */
  async createResource(resourceData) {
    const { name, type, quantity, description, location, owner, cost } =
      resourceData;

    if (!name || !type || !quantity) {
      return {
        success: false,
        error: 'Missing required fields: name, type, quantity'
      };
    }

    try {
      const resource = await Resource.create({
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

      return { success: true, resource: normalizeResource(resource) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get resource by ID
   * @param {string} resourceId - Resource ID
   * @returns {object|null} Resource record
   */
  async getResourceById(resourceId) {
    try {
      const resource = await Resource.findById(resourceId).lean();
      return normalizeResource(resource);
    } catch (error) {
      console.error('Error fetching resource:', error);
      return null;
    }
  }

  /**
   * Get all resources
   * @param {object} filters - Filter options (type, status, condition)
   * @returns {array} List of resources
   */
  async getAllResources(filters = {}) {
    try {
      const query = {};

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.condition) {
        query.condition = filters.condition;
      }

      const resources = await Resource.find(query).lean();
      return resources.map((resource) => normalizeResource(resource));
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  /**
   * Get available resources
   * @param {object} filters - Filter options
   * @returns {array} Resources with available quantity > 0
   */
  async getAvailableResources(filters = {}) {
    try {
      const query = { availableQuantity: { $gt: 0 } };

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.condition) {
        query.condition = filters.condition;
      }

      const resources = await Resource.find(query).lean();
      return resources.map((resource) => normalizeResource(resource));
    } catch (error) {
      console.error('Error fetching available resources:', error);
      return [];
    }
  }

  /**
   * Update resource information
   * @param {string} resourceId - Resource ID
   * @param {object} updateData - Data to update
   * @returns {object} Updated resource record
   */
  async updateResource(resourceId, updateData) {
    try {
      const resource = await Resource.findByIdAndUpdate(
        resourceId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!resource) {
        return { success: false, error: 'Resource not found' };
      }

      return { success: true, resource: normalizeResource(resource) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete resource
   * @param {string} resourceId - Resource ID
   * @returns {object} Deletion result
   */
  async deleteResource(resourceId) {
    try {
      const resource = await Resource.findByIdAndDelete(resourceId);

      if (!resource) {
        return { success: false, error: 'Resource not found' };
      }

      return { success: true, message: 'Resource deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Allocate resource to event
   * @param {string} eventId - Event ID
   * @param {string} resourceId - Resource ID
   * @param {object} allocationData - Allocation details
   * @returns {object} Created allocation
   */
  async allocateResourceToEvent(eventId, resourceId, allocationData = {}) {
    if (!eventId || !resourceId) {
      return { success: false, error: 'eventId and resourceId are required' };
    }

    const { allocatedQuantity, startDate, endDate, notes } = allocationData;

    if (!allocatedQuantity || !startDate || !endDate) {
      return {
        success: false,
        error: 'Missing required fields: allocatedQuantity, startDate, endDate'
      };
    }

    try {
      const resource = await Resource.findById(resourceId);
      if (!resource) {
        return { success: false, error: 'Resource not found' };
      }

      if (allocatedQuantity > resource.availableQuantity) {
        return {
          success: false,
          error: `Insufficient availability. Available: ${resource.availableQuantity}, Requested: ${allocatedQuantity}`
        };
      }

      const conflicts = await this.checkAllocationConflicts(
        resource,
        startDate,
        endDate
      );
      if (conflicts.length > 0) {
        return {
          success: false,
          error: 'Resource is already allocated during this period',
          conflicts
        };
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

      await resource.save();

      return {
        success: true,
        allocation: normalizeAllocation(allocation, resourceId)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for conflicting allocations
   * @param {string|object} resourceId - Resource ID or resource document
   * @param {Date} startDate - Allocation start date
   * @param {Date} endDate - Allocation end date
   * @returns {array} Conflicting allocations
   */
  async checkAllocationConflicts(resourceId, startDate, endDate) {
    try {
      const resource =
        typeof resourceId === 'string'
          ? await Resource.findById(resourceId).lean()
          : resourceId;

      if (!resource) {
        return [];
      }

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
    } catch (error) {
      console.error('Error checking allocation conflicts:', error);
      return [];
    }
  }

  /**
   * Get allocations for event
   * @param {string} eventId - Event ID
   * @returns {array} Resource allocations for event
   */
  async getEventResources(eventId) {
    try {
      const resources = await Resource.find({
        'allocations.eventId': eventId
      }).lean();

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
    } catch (error) {
      console.error('Error fetching event resources:', error);
      return [];
    }
  }

  /**
   * Get allocations for resource
   * @param {string} resourceId - Resource ID
   * @returns {array} All allocations for this resource
   */
  async getResourceAllocations(resourceId) {
    try {
      const resource = await Resource.findById(resourceId).lean();
      if (!resource) {
        return [];
      }

      return (resource.allocations || [])
        .map((allocation) => normalizeAllocation(allocation, resourceId))
        .filter(Boolean);
    } catch (error) {
      console.error('Error fetching resource allocations:', error);
      return [];
    }
  }

  /**
   * Update allocation status
   * @param {string} allocationId - Allocation ID
   * @param {string} newStatus - New status (allocated, in-use, returned, damaged)
   * @returns {object} Updated allocation
   */
  async updateAllocationStatus(allocationId, newStatus) {
    const validStatuses = ['allocated', 'in-use', 'returned', 'damaged'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    try {
      const resource = await Resource.findOne({
        'allocations.allocationId': allocationId
      });
      if (!resource) {
        return { success: false, error: 'Allocation not found' };
      }

      const allocation = resource.allocations.find(
        (item) => item.allocationId === allocationId
      );
      if (!allocation) {
        return { success: false, error: 'Allocation not found' };
      }

      const previousStatus = allocation.status;
      allocation.status = newStatus;
      allocation.updatedAt = new Date();

      if (previousStatus !== 'returned' && newStatus === 'returned') {
        resource.availableQuantity += allocation.allocatedQuantity;
      }

      await resource.save();

      return {
        success: true,
        allocation: normalizeAllocation(allocation, resource.id || resource._id)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update resource maintenance date
   * @param {string} resourceId - Resource ID
   * @param {Date} maintenanceDate - Maintenance date
   * @returns {object} Updated resource
   */
  async updateMaintenance(resourceId, maintenanceDate) {
    try {
      const maintenance = new Date(maintenanceDate);
      const resource = await Resource.findByIdAndUpdate(
        resourceId,
        {
          maintenanceDate: maintenance,
          lastMaintenanceDate: maintenance,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!resource) {
        return { success: false, error: 'Resource not found' };
      }

      return { success: true, resource: normalizeResource(resource) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default ResourceService;

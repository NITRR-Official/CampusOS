import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '../../../../backend/src/database/connection.js';
import { Resource } from '../../../../backend/src/database/schemas/resource.schema.js';
import { ResourceService } from './resource.service.js';

describe('ResourceService', () => {
  let service;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Resource.deleteMany({});
    service = new ResourceService();
  });

  describe('createResource', () => {
    it('should create a new resource with required fields', async () => {
      const resourceData = {
        name: 'Projector',
        type: 'technology',
        quantity: 5,
        description: 'High-end projector for events',
        location: 'Storage Room A',
        owner: 'Tech Department',
        cost: 50000
      };

      const result = await service.createResource(resourceData);

      expect(result.success).toBe(true);
      expect(result.resource).toBeDefined();
      expect(result.resource.name).toBe('Projector');
      expect(result.resource.type).toBe('technology');
      expect(result.resource.quantity).toBe(5);
      expect(result.resource.availableQuantity).toBe(5);
      expect(result.resource.status).toBe('available');
      expect(result.resource.condition).toBe('good');
    });

    it('should fail when missing required fields', async () => {
      const resourceData = {
        name: 'Incomplete Resource'
        // missing type and quantity
      };

      const result = await service.createResource(resourceData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should generate unique IDs for resources', async () => {
      const resource1 = {
        name: 'Chairs',
        type: 'furniture',
        quantity: 100
      };

      const resource2 = {
        name: 'Tables',
        type: 'furniture',
        quantity: 50
      };

      const result1 = await service.createResource(resource1);
      const result2 = await service.createResource(resource2);

      expect(result1.resource.id).not.toBe(result2.resource.id);
    });

    it('should set initial availableQuantity equal to quantity', async () => {
      const resourceData = {
        name: 'Sound System',
        type: 'technology',
        quantity: 3
      };

      const result = await service.createResource(resourceData);

      expect(result.resource.availableQuantity).toBe(result.resource.quantity);
    });
  });

  describe('getResourceById', () => {
    it('should retrieve resource by ID', async () => {
      const resourceData = {
        name: 'Lights',
        type: 'equipment',
        quantity: 20
      };

      const createResult = await service.createResource(resourceData);
      const resourceId = createResult.resource.id;

      const getResult = await service.getResourceById(resourceId);

      expect(getResult).toBeDefined();
      expect(getResult.id).toBe(resourceId);
      expect(getResult.name).toBe('Lights');
    });

    it('should return null for non-existent resource', async () => {
      const result = await service.getResourceById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllResources', () => {
    beforeEach(async () => {
      await service.createResource({
        name: 'Chairs',
        type: 'furniture',
        quantity: 100
      });

      await service.createResource({
        name: 'Microphones',
        type: 'equipment',
        quantity: 10
      });
    });

    it('should return all resources', async () => {
      const resources = await service.getAllResources();

      expect(resources).toHaveLength(2);
    });

    it('should filter resources by type', async () => {
      const resources = await service.getAllResources({ type: 'furniture' });

      expect(resources).toHaveLength(1);
      expect(resources[0].type).toBe('furniture');
    });

    it('should return empty array when no resources exist', async () => {
      await Resource.deleteMany({});
      const resources = await service.getAllResources();

      expect(resources).toHaveLength(0);
    });
  });

  describe('getAvailableResources', () => {
    beforeEach(async () => {
      const availableResource = await service.createResource({
        name: 'Available Projector',
        type: 'technology',
        quantity: 5
      });

      const allocatedResource = await service.createResource({
        name: 'Fully Allocated Projector',
        type: 'technology',
        quantity: 2
      });

      // Simulate full allocation
      await service.allocateResourceToEvent(
        'event-1',
        allocatedResource.resource.id,
        {
          allocatedQuantity: 2,
          startDate: new Date('2026-05-10'),
          endDate: new Date('2026-05-11')
        }
      );
    });

    it('should return only resources with available quantity', async () => {
      const resources = await service.getAvailableResources();

      expect(resources.every((r) => r.availableQuantity > 0)).toBe(true);
    });
  });

  describe('allocateResourceToEvent', () => {
    let resourceId, eventId;

    beforeEach(async () => {
      const resourceResult = await service.createResource({
        name: 'Allocated Resource',
        type: 'furniture',
        quantity: 10
      });
      resourceId = resourceResult.resource.id;
      eventId = 'event-123';
    });

    it('should allocate resource to event', async () => {
      const allocationData = {
        allocatedQuantity: 5,
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-11')
      };

      const result = await service.allocateResourceToEvent(
        eventId,
        resourceId,
        allocationData
      );

      expect(result.success).toBe(true);
      expect(result.allocation).toBeDefined();
      expect(result.allocation.allocatedQuantity).toBe(5);
      expect(result.allocation.resourceId).toBe(resourceId);
      expect(result.allocation.eventId).toBe(eventId);
    });

    it('should fail when allocating more than available', async () => {
      const allocationData = {
        allocatedQuantity: 15, // More than available (10)
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-11')
      };

      const result = await service.allocateResourceToEvent(
        eventId,
        resourceId,
        allocationData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient availability');
    });

    it('should update availableQuantity after allocation', async () => {
      const allocationData = {
        allocatedQuantity: 3,
        startDate: new Date('2026-05-10'),
        endDate: new Date('2026-05-11')
      };

      await service.allocateResourceToEvent(
        eventId,
        resourceId,
        allocationData
      );
      const updatedResource = await service.getResourceById(resourceId);

      expect(updatedResource.availableQuantity).toBe(7); // 10 - 3
    });
  });

  describe('checkAllocationConflicts', () => {
    let resourceId;

    beforeEach(async () => {
      const resourceResult = await service.createResource({
        name: 'Conflict Test Resource',
        type: 'furniture',
        quantity: 10
      });
      resourceId = resourceResult.resource.id;

      // Create overlapping allocations
      await service.allocateResourceToEvent('event-1', resourceId, {
        allocatedQuantity: 5,
        startDate: new Date('2026-05-10T10:00:00'),
        endDate: new Date('2026-05-10T15:00:00')
      });
    });

    it('should detect time-based conflicts', async () => {
      const conflicts = await service.checkAllocationConflicts(
        resourceId,
        new Date('2026-05-10T14:00:00'),
        new Date('2026-05-10T16:00:00')
      );

      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should not report conflicts for non-overlapping times', async () => {
      const conflicts = await service.checkAllocationConflicts(
        resourceId,
        new Date('2026-05-11T10:00:00'),
        new Date('2026-05-11T15:00:00')
      );

      expect(conflicts.length).toBe(0);
    });
  });

  describe('updateAllocationStatus', () => {
    it('should update allocation status', async () => {
      const resourceResult = await service.createResource({
        name: 'Status Update Resource',
        type: 'furniture',
        quantity: 5
      });

      const allocationResult = await service.allocateResourceToEvent(
        'event-1',
        resourceResult.resource.id,
        {
          allocatedQuantity: 3,
          startDate: new Date('2026-05-10'),
          endDate: new Date('2026-05-11')
        }
      );

      const updateResult = await service.updateAllocationStatus(
        allocationResult.allocation.id,
        'returned'
      );

      expect(updateResult.success).toBe(true);
      expect(updateResult.allocation.status).toBe('returned');
    });
  });
});

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { Resource } from '../schema/resource.model.js';
import { createResourceService } from '../service/resource.service.js';
import { createResourceRepository } from '../repository/resource.repository.js';
import { registerResourceHandlers } from './index.js';

describe('Resource Listeners (Integration)', () => {
  let mongoServer;
  let resourceService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    eventBus = new EventEmitter();
    const repo = createResourceRepository();
    resourceService = createResourceService(repo, eventBus);

    registerResourceHandlers(eventBus, {}, resourceService);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Resource.deleteMany({});
  });

  describe('club:deleted listener', () => {
    it('should delete all resources owned by the deleted club', async () => {
      const clubId = 'club-delete-resource-1';

      await resourceService.createResource({
        name: 'Projector A',
        type: 'equipment',
        quantity: 2,
        owner: clubId
      });

      await resourceService.createResource({
        name: 'Microphone Set',
        type: 'equipment',
        quantity: 5,
        owner: clubId
      });

      await resourceService.createResource({
        name: 'Other Club Speaker',
        type: 'equipment',
        quantity: 1,
        owner: 'other-club'
      });

      const resourcesBefore = await Resource.find({ owner: clubId });
      expect(resourcesBefore.length).toBe(2);

      eventBus.emit('club:deleted', { clubId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const resourcesAfter = await Resource.find({ owner: clubId });
      expect(resourcesAfter.length).toBe(0);

      const otherResources = await Resource.find({ owner: 'other-club' });
      expect(otherResources.length).toBe(1);
    });
  });

  describe('event:deleted listener', () => {
    it('should remove event allocations when an event is deleted', async () => {
      const resource = await resourceService.createResource({
        name: 'Chairs',
        type: 'furniture',
        quantity: 100,
        owner: 'admin'
      });

      const eventId = 'event-to-delete-123';
      await resourceService.allocateResourceToEvent(eventId, resource.id, {
        allocatedQuantity: 20,
        startDate: new Date('2026-11-01T10:00:00Z'),
        endDate: new Date('2026-11-01T14:00:00Z')
      });

      const resWithAlloc = await Resource.findById(resource.id);
      expect(resWithAlloc.allocations.length).toBe(1);
      expect(resWithAlloc.availableQuantity).toBe(80);

      eventBus.emit('event:deleted', { eventId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const resAfter = await Resource.findById(resource.id);
      expect(resAfter.allocations.length).toBe(0);
      expect(resAfter.availableQuantity).toBe(100);
    });
  });
});

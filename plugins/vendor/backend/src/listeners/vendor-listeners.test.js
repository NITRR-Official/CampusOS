import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { Vendor } from '../schema/vendor.model.js';
import { createVendorService } from '../service/vendor.service.js';
import { VendorRepository } from '../repository/vendor.repository.js';
import { registerVendorHandlers } from './index.js';

describe('Vendor Listeners (Integration)', () => {
  let mongoServer;
  let vendorService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    eventBus = new EventEmitter();

    const vendorRepo = new VendorRepository();
    vendorService = createVendorService(vendorRepo);
    vendorService.setEventBus(eventBus);

    registerVendorHandlers(eventBus, {}, vendorService);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Vendor.deleteMany({});
  });

  describe('event:deleted listener', () => {
    it('should delete vendor assignments associated with the event', async () => {
      const eventId = new mongoose.Types.ObjectId().toString();

      const vendorData = await vendorService.createVendor({
        clubId: 'test-club',
        name: 'Test Vendor',
        category: 'Food',
        contactPerson: 'John Doe',
        email: 'john@test.com',
        phone: '1234567890'
      });

      await vendorService.assignVendorToEvent(eventId, vendorData.id, {
        amount: 1000
      });

      const vendorsBefore = await vendorService.getEventVendors(eventId);
      expect(vendorsBefore.length).toBe(1);

      eventBus.emit('event:deleted', { eventId });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const vendorsAfter = await vendorService.getEventVendors(eventId);
      expect(vendorsAfter.length).toBe(0);
    });
  });
});

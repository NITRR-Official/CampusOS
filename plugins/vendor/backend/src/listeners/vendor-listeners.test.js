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

      await new Promise((resolve) => setTimeout(resolve, 50));

      const vendorsAfter = await vendorService.getEventVendors(eventId);
      expect(vendorsAfter.length).toBe(0);
    });
  });

  describe('club:deleted listener', () => {
    it('should delete all vendors associated with the deleted club', async () => {
      const clubId = 'club-to-delete-123';

      await vendorService.createVendor({
        clubId,
        name: 'Club Vendor 1',
        category: 'Audio',
        contactPerson: 'Jane Doe',
        email: 'jane@test.com',
        phone: '9876543210'
      });

      await vendorService.createVendor({
        clubId,
        name: 'Club Vendor 2',
        category: 'Lighting',
        contactPerson: 'Bob Smith',
        email: 'bob@test.com',
        phone: '9876543211'
      });

      const otherClubVendor = await vendorService.createVendor({
        clubId: 'other-club',
        name: 'Other Club Vendor',
        category: 'Food',
        contactPerson: 'Alice',
        email: 'alice@test.com',
        phone: '9876543212'
      });

      const vendorsBefore = await Vendor.find({ clubId });
      expect(vendorsBefore.length).toBe(2);

      eventBus.emit('club:deleted', { clubId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const vendorsAfter = await Vendor.find({ clubId });
      expect(vendorsAfter.length).toBe(0);

      // Verify other club's vendors are untouched
      const otherVendors = await Vendor.find({ clubId: 'other-club' });
      expect(otherVendors.length).toBe(1);
    });
  });
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Vendor } from '../schema/vendor.model.js';
import { createVendorService } from './vendor.service.js';
import { VendorRepository } from '../repository/vendor.repository.js';

describe('VendorService', () => {
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
    await Vendor.deleteMany({});
    const repository = new VendorRepository();
    service = createVendorService(repository);
  });

  describe('createVendor', () => {
    it('should create a new vendor with all required fields', async () => {
      const vendorData = {
        clubId: 'club-123',
        name: 'Tech Supplies Co',
        category: 'technology',
        contactPerson: 'John Doe',
        email: 'john@techsupplies.com',
        phone: '+1234567890',
        address: '123 Tech Street',
        bankDetails: { accountNumber: '123456789', bankName: 'Tech Bank' }
      };

      const result = await service.createVendor(vendorData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Tech Supplies Co');
      expect(result.category).toBe('technology');
      expect(result.status).toBe('active');
      expect(result.rating).toBe(0);
      expect(result.totalEvents).toBe(0);
    });

    it('should fail when missing required fields', async () => {
      const vendorData = {
        clubId: 'club-123',
        name: 'Incomplete Vendor',
        category: 'catering'
        // missing contactPerson, email, phone
      };

      await expect(service.createVendor(vendorData)).rejects.toThrow();
    });

    it('should generate unique IDs for vendors', async () => {
      const vendor1 = {
        clubId: 'club-123',
        name: 'Vendor One',
        category: 'catering',
        contactPerson: 'Alice',
        email: 'alice@vendor1.com',
        phone: '1111111111'
      };

      const vendor2 = {
        clubId: 'club-123',
        name: 'Vendor Two',
        category: 'decoration',
        contactPerson: 'Bob',
        email: 'bob@vendor2.com',
        phone: '2222222222'
      };

      const result1 = await service.createVendor(vendor1);
      const result2 = await service.createVendor(vendor2);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getAllVendors', () => {
    beforeEach(async () => {
      await service.createVendor({
        clubId: 'club-123',
        name: 'Vendor A',
        category: 'catering',
        contactPerson: 'Person A',
        email: 'a@vendor.com',
        phone: '1111111111'
      });

      await service.createVendor({
        clubId: 'club-123',
        name: 'Vendor B',
        category: 'decoration',
        contactPerson: 'Person B',
        email: 'b@vendor.com',
        phone: '2222222222'
      });
    });

    it('should return all vendors', async () => {
      const vendors = await service.getAllVendors({ clubId: 'club-123' });
      expect(vendors).toHaveLength(2);
    });

    it('should filter vendors by category', async () => {
      const vendors = await service.getAllVendors({
        clubId: 'club-123',
        category: 'catering'
      });
      expect(vendors).toHaveLength(1);
      expect(vendors[0].category).toBe('catering');
    });

    it('should return empty array when no vendors exist', async () => {
      await Vendor.deleteMany({});
      const vendors = await service.getAllVendors({ clubId: 'club-123' });
      expect(vendors).toHaveLength(0);
    });
  });

  describe('getVendorById', () => {
    it('should retrieve vendor by ID', async () => {
      const vendorData = {
        clubId: 'club-123',
        name: 'Retrievable Vendor',
        category: 'catering',
        contactPerson: 'Diana',
        email: 'diana@vendor.com',
        phone: '4444444444'
      };

      const createResult = await service.createVendor(vendorData);
      const vendorId = createResult.id;

      const vendor = await service.getVendorById(vendorId);

      expect(vendor).toBeDefined();
      expect(vendor.id.toString()).toBe(vendorId.toString());
      expect(vendor.name).toBe('Retrievable Vendor');
    });

    it('should return null for non-existent vendor', async () => {
      const result = await service.getVendorById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });
  });

  describe('assignVendorToEvent', () => {
    let vendorId, eventId;

    beforeEach(async () => {
      const vendorResult = await service.createVendor({
        clubId: 'club-123',
        name: 'Event Vendor',
        category: 'catering',
        contactPerson: 'Eve',
        email: 'eve@vendor.com',
        phone: '5555555555'
      });
      vendorId = vendorResult.id;
      eventId = 'event-123';
    });

    it('should assign vendor to event', async () => {
      const assignData = {
        amount: 5000,
        notes: 'Catering for event'
      };

      const result = await service.assignVendorToEvent(
        eventId,
        vendorId,
        assignData
      );

      expect(result).toBeDefined();
      expect(result.vendorId).toBe(vendorId);
      expect(result.eventId).toBe(eventId);
    });

    it('should fail to assign non-existent vendor', async () => {
      const assignData = {
        amount: 5000,
        notes: 'Catering for event'
      };

      const result = await service.assignVendorToEvent(
        eventId,
        '507f1f77bcf86cd799439011',
        assignData
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('rateVendor', () => {
    let vendorId;

    beforeEach(async () => {
      const vendorResult = await service.createVendor({
        clubId: 'club-123',
        name: 'Rateable Vendor',
        category: 'decoration',
        contactPerson: 'Frank',
        email: 'frank@vendor.com',
        phone: '6666666666'
      });
      vendorId = vendorResult.id;
    });

    it('should rate vendor with valid rating', async () => {
      const result = await service.rateVendor(vendorId, 4.5);
      expect(result).toBeDefined();
      expect(result.rating).toBe(4.5);
    });

    it('should reject rating above 5', async () => {
      await expect(service.rateVendor(vendorId, 6)).rejects.toThrow();
    });

    it('should reject rating below 0', async () => {
      await expect(service.rateVendor(vendorId, -1)).rejects.toThrow();
    });
  });
});

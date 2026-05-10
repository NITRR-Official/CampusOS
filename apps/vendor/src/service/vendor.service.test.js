import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../../../backend/src/database/connection.js';
import { Vendor } from '../../../../backend/src/database/schemas/vendor.schema.js';
import { VendorService } from './vendor.service.js';

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
    service = new VendorService();
  });

  describe('createVendor', () => {
    it('should create a new vendor with all required fields', async () => {
      const vendorData = {
        name: 'Tech Supplies Co',
        category: 'technology',
        contactPerson: 'John Doe',
        email: 'john@techsupplies.com',
        phone: '+1234567890',
        address: '123 Tech Street',
        bankDetails: { accountNumber: '123456789', bankName: 'Tech Bank' }
      };

      const result = await service.createVendor(vendorData);

      expect(result.success).toBe(true);
      expect(result.vendor).toBeDefined();
      expect(result.vendor.name).toBe('Tech Supplies Co');
      expect(result.vendor.category).toBe('technology');
      expect(result.vendor.status).toBe('active');
      expect(result.vendor.rating).toBe(0);
      expect(result.vendor.totalEvents).toBe(0);
    });

    it('should fail when missing required fields', async () => {
      const vendorData = {
        name: 'Incomplete Vendor',
        category: 'catering'
        // missing contactPerson, email, phone
      };

      const result = await service.createVendor(vendorData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should generate unique IDs for vendors', async () => {
      const vendor1 = {
        name: 'Vendor One',
        category: 'catering',
        contactPerson: 'Alice',
        email: 'alice@vendor1.com',
        phone: '1111111111'
      };

      const vendor2 = {
        name: 'Vendor Two',
        category: 'decoration',
        contactPerson: 'Bob',
        email: 'bob@vendor2.com',
        phone: '2222222222'
      };

      const result1 = await service.createVendor(vendor1);
      const result2 = await service.createVendor(vendor2);

      expect(result1.vendor.id).not.toBe(result2.vendor.id);
    });

    it('should set timestamps on vendor creation', async () => {
      const vendorData = {
        name: 'Time Test Vendor',
        category: 'logistics',
        contactPerson: 'Charlie',
        email: 'charlie@vendor.com',
        phone: '3333333333'
      };

      const beforeCreate = new Date();
      const result = await service.createVendor(vendorData);
      const afterCreate = new Date();

      expect(result.vendor.createdAt).toBeInstanceOf(Date);
      expect(result.vendor.updatedAt).toBeInstanceOf(Date);
      expect(result.vendor.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(result.vendor.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('getAllVendors', () => {
    beforeEach(async () => {
      await service.createVendor({
        name: 'Vendor A',
        category: 'catering',
        contactPerson: 'Person A',
        email: 'a@vendor.com',
        phone: '1111111111'
      });

      await service.createVendor({
        name: 'Vendor B',
        category: 'decoration',
        contactPerson: 'Person B',
        email: 'b@vendor.com',
        phone: '2222222222'
      });
    });

    it('should return all vendors', async () => {
      const vendors = await service.getAllVendors();

      expect(vendors).toHaveLength(2);
    });

    it('should filter vendors by category', async () => {
      const vendors = await service.getAllVendors({ category: 'catering' });

      expect(vendors).toHaveLength(1);
      expect(vendors[0].category).toBe('catering');
    });

    it('should return empty array when no vendors exist', async () => {
      await Vendor.deleteMany({});
      const vendors = await service.getAllVendors();

      expect(vendors).toHaveLength(0);
    });
  });

  describe('getVendorById', () => {
    it('should retrieve vendor by ID', async () => {
      const vendorData = {
        name: 'Retrievable Vendor',
        category: 'catering',
        contactPerson: 'Diana',
        email: 'diana@vendor.com',
        phone: '4444444444'
      };

      const createResult = await service.createVendor(vendorData);
      const vendorId = createResult.vendor.id;

      const vendor = await service.getVendorById(vendorId);

      expect(vendor).toBeDefined();
      expect(vendor.id).toBe(vendorId);
      expect(vendor.name).toBe('Retrievable Vendor');
    });

    it('should return null for non-existent vendor', async () => {
      const result = await service.getVendorById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('assignVendorToEvent', () => {
    let vendorId, eventId;

    beforeEach(async () => {
      const vendorResult = await service.createVendor({
        name: 'Event Vendor',
        category: 'catering',
        contactPerson: 'Eve',
        email: 'eve@vendor.com',
        phone: '5555555555'
      });
      vendorId = vendorResult.vendor.id;
      eventId = 'event-123';
    });

    it('should assign vendor to event', async () => {
      const assignData = {
        amount: 5000,
        notes: 'Catering for event'
      };

      const result = await service.assignVendorToEvent(eventId, vendorId, assignData);

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment.vendorId).toBe(vendorId);
      expect(result.assignment.eventId).toBe(eventId);
    });

    it('should fail to assign non-existent vendor', async () => {
      const assignData = {
        amount: 5000,
        notes: 'Catering for event'
      };

      const result = await service.assignVendorToEvent(eventId, 'fake-vendor-id', assignData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('rateVendor', () => {
    let vendorId;

    beforeEach(async () => {
      const vendorResult = await service.createVendor({
        name: 'Rateable Vendor',
        category: 'decoration',
        contactPerson: 'Frank',
        email: 'frank@vendor.com',
        phone: '6666666666'
      });
      vendorId = vendorResult.vendor.id;
    });

    it('should rate vendor with valid rating', async () => {
      const result = await service.rateVendor(vendorId, 4.5);

      expect(result.success).toBe(true);
      expect(result.vendor.rating).toBe(4.5);
    });

    it('should reject rating above 5', async () => {
      const result = await service.rateVendor(vendorId, 6);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 5');
    });

    it('should reject rating below 0', async () => {
      const result = await service.rateVendor(vendorId, -1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('between 0 and 5');
    });
  });
});

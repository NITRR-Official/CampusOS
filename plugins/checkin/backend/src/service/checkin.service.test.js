import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import mongoose from 'mongoose';
import { CheckIn } from '../schema/checkin.model.js';
import { createCheckInRepository } from '../repository/checkin.repository.js';
import { createCheckInService } from './checkin.service.js';

describe('CheckInService', () => {
  let service;
  let mongoServer;

  const event1 = new mongoose.Types.ObjectId().toString();
  const event2 = new mongoose.Types.ObjectId().toString();
  const user1 = new mongoose.Types.ObjectId().toString();
  const user2 = new mongoose.Types.ObjectId().toString();
  const user3 = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  }, 120000);

  beforeEach(async () => {
    await CheckIn.deleteMany({});
    const repository = createCheckInRepository();
    service = createCheckInService(repository);
  });

  describe('createCheckIn', () => {
    it('should create a checkin record', async () => {
      const result = await service.createCheckIn(event1, user1);
      expect(result).toBeDefined();
      expect(result.eventId.toString()).toBe(event1);
      expect(result.userId.toString()).toBe(user1);
      expect(result.status).toBe('pending');
      expect(result.qrCode).toBeDefined();
    });

    it('should require eventId and userId', async () => {
      await expect(service.createCheckIn(null, user1)).rejects.toThrow(
        'eventId and userId are required'
      );
    });
  });

  describe('markAsCheckedInByQRCode', () => {
    it('should mark a user as checked in using QR code', async () => {
      const checkIn = await service.createCheckIn(event1, user1);
      const result = await service.markAsCheckedInByQRCode(checkIn.qrCode);
      expect(result.status).toBe('checked-in');
      expect(result.checkedInAt).toBeDefined();
    });

    it('should fail with invalid QR code', async () => {
      await expect(
        service.markAsCheckedInByQRCode('invalid_qr')
      ).rejects.toThrow('Invalid QR code');
    });

    it('should not allow double check-in', async () => {
      const checkIn = await service.createCheckIn(event1, user1);
      await service.markAsCheckedInByQRCode(checkIn.qrCode);
      await expect(
        service.markAsCheckedInByQRCode(checkIn.qrCode)
      ).rejects.toThrow('Already checked in');
    });
  });

  describe('getAttendanceStats', () => {
    it('should return correct statistics', async () => {
      const c1 = await service.createCheckIn(event1, user1);
      await service.createCheckIn(event1, user2);
      await service.createCheckIn(event1, user3);
      await service.createCheckIn(event2, user1);
      await service.markAsCheckedInByQRCode(c1.qrCode);

      const stats = await service.getAttendanceStats(event1);
      expect(stats.totalRegistered).toBe(3);
      expect(stats.checkedIn).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.checkInRate).toBe('33.33');
    });
  });
});

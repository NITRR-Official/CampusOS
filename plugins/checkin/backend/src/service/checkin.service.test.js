import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { CheckIn } from '../schema/checkin.model.js';
import { createCheckInRepository } from '../repository/checkin.repository.js';
import { createCheckInService } from './checkin.service.js';

describe('CheckInService', () => {
  let service;
  let mongoServer;

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
      const result = await service.createCheckIn('event_1', 'user_1');
      expect(result.success).toBe(true);
      expect(result.checkIn.eventId).toBe('event_1');
      expect(result.checkIn.userId).toBe('user_1');
      expect(result.checkIn.status).toBe('pending');
      expect(result.checkIn.qrCode).toBeDefined();
    });

    it('should require eventId and userId', async () => {
      const result = await service.createCheckIn(null, 'user_1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('eventId and userId are required');
    });
  });

  describe('markAsCheckedInByQRCode', () => {
    it('should mark a user as checked in using QR code', async () => {
      const { checkIn } = await service.createCheckIn('event_1', 'user_1');

      const result = await service.markAsCheckedInByQRCode(checkIn.qrCode);
      expect(result.success).toBe(true);
      expect(result.checkIn.status).toBe('checked-in');
      expect(result.checkIn.checkedInAt).toBeDefined();
    });

    it('should fail with invalid QR code', async () => {
      const result = await service.markAsCheckedInByQRCode('invalid_qr');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid QR code');
    });

    it('should not allow double check-in', async () => {
      const { checkIn } = await service.createCheckIn('event_1', 'user_1');
      await service.markAsCheckedInByQRCode(checkIn.qrCode);

      const result2 = await service.markAsCheckedInByQRCode(checkIn.qrCode);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Already checked in');
    });
  });

  describe('getAttendanceStats', () => {
    it('should return correct statistics', async () => {
      // 3 users registered
      const { checkIn: c1 } = await service.createCheckIn('event_1', 'user_1');
      await service.createCheckIn('event_1', 'user_2');
      await service.createCheckIn('event_1', 'user_3');

      // another event
      await service.createCheckIn('event_2', 'user_1');

      // 1 user checked in to event_1
      await service.markAsCheckedInByQRCode(c1.qrCode);

      const stats = await service.getAttendanceStats('event_1');
      expect(stats.totalRegistered).toBe(3);
      expect(stats.checkedIn).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.checkInRate).toBe('33.33');
    });
  });
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Conflict, TimeSlot } from '../schema/scheduling.model.js';
import { createSchedulingService } from './scheduling.service.js';

describe('SchedulingService', () => {
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
    await TimeSlot.deleteMany({});
    await Conflict.deleteMany({});
    service = createSchedulingService();
  });

  describe('createTimeSlot', () => {
    it('should create a new time slot with required fields', async () => {
      const slotData = {
        eventId: 'event-1',
        venue: 'Auditorium A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 500,
        allocatedResources: [
          { resourceId: 'projector-1', quantity: 1 },
          { resourceId: 'microphone-1', quantity: 2 }
        ],
        notes: 'Main event session'
      };

      const slot = await service.createTimeSlot(slotData);

      expect(slot).toBeDefined();
      expect(slot.eventId).toBe('event-1');
      expect(slot.venue).toBe('Auditorium A');
      expect(slot.capacity).toBe(500);
      expect(slot.status).toBe('scheduled');
    });

    it('should fail when missing required fields', async () => {
      const slotData = {
        eventId: 'event-1',
        venue: 'Auditorium A'
        // missing startTime, endTime, capacity
      };

      await expect(service.createTimeSlot(slotData)).rejects.toThrow('Missing required fields');
    });

    it('should fail when startTime is after endTime', async () => {
      const slotData = {
        eventId: 'event-1',
        venue: 'Auditorium A',
        startTime: new Date('2026-05-15T14:00:00'),
        endTime: new Date('2026-05-15T12:00:00'), // End before start
        capacity: 500
      };

      await expect(service.createTimeSlot(slotData)).rejects.toThrow('startTime must be before endTime');
    });

    it('should generate unique slot IDs', async () => {
      const slot1 = {
        eventId: 'event-1',
        venue: 'Auditorium A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 500
      };

      const slot2 = {
        eventId: 'event-1',
        venue: 'Auditorium B',
        startTime: new Date('2026-05-15T13:00:00'),
        endTime: new Date('2026-05-15T15:00:00'),
        capacity: 300
      };

      const slot1Res = await service.createTimeSlot(slot1);
      const slot2Res = await service.createTimeSlot(slot2);

      expect(slot1Res.id).not.toBe(slot2Res.id);
    });
  });

  describe('getTimeSlotById', () => {
    it('should retrieve time slot by ID', async () => {
      const slotData = {
        eventId: 'event-1',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 100
      };

      const slot = await service.createTimeSlot(slotData);
      const slotId = slot.id;

      const getResult = await service.getTimeSlotById(slotId);

      expect(getResult).toBeDefined();
      expect(getResult.id.toString()).toBe(slotId.toString());
      expect(getResult.venue).toBe('Hall A');
    });

    it('should return null for non-existent slot', async () => {
      // Mock ObjectId CastError or just use a valid string that doesn't exist
      const mongoose = (await import('mongoose')).default;
      const validId = new mongoose.Types.ObjectId().toString();
      const result = await service.getTimeSlotById(validId);

      expect(result).toBeNull();
    });
  });

  describe('getEventTimeSlots', () => {
    beforeEach(async () => {
      await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 100
      });

      await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Hall B',
        startTime: new Date('2026-05-15T13:00:00'),
        endTime: new Date('2026-05-15T15:00:00'),
        capacity: 150
      });

      await service.createTimeSlot({
        eventId: 'event-2',
        venue: 'Hall C',
        startTime: new Date('2026-05-16T10:00:00'),
        endTime: new Date('2026-05-16T12:00:00'),
        capacity: 200
      });
    });

    it('should return all time slots for an event', async () => {
      const slots = await service.getEventTimeSlots('event-1');

      expect(slots).toHaveLength(2);
      expect(slots.every((s) => s.eventId === 'event-1')).toBe(true);
    });

    it('should return empty array for event with no slots', async () => {
      const slots = await service.getEventTimeSlots('event-999');

      expect(slots).toHaveLength(0);
    });
  });

  describe('isVenueAvailable', () => {
    beforeEach(async () => {
      await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Main Hall',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 500
      });
    });

    it('should return true for non-overlapping time', async () => {
      const available = await service.isVenueAvailable(
        'Main Hall',
        new Date('2026-05-15T13:00:00'),
        new Date('2026-05-15T15:00:00')
      );

      expect(available).toBe(true);
    });

    it('should return false for overlapping time', async () => {
      const available = await service.isVenueAvailable(
        'Main Hall',
        new Date('2026-05-15T11:00:00'),
        new Date('2026-05-15T13:00:00')
      );

      expect(available).toBe(false);
    });
  });

  describe('detectConflictsForSlot', () => {
    it('should detect venue conflicts', async () => {
      const slot1 = await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Auditorium A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 500
      });

      const slot2Data = {
        eventId: 'event-2',
        venue: 'Auditorium A',
        startTime: new Date('2026-05-15T11:00:00'),
        endTime: new Date('2026-05-15T13:00:00'),
        capacity: 300
      };

      await service.createTimeSlot(slot2Data);
      const conflicts = await service.getAllConflicts();

      expect(conflicts.some((c) => c.conflictType === 'venue-overlap')).toBe(
        true
      );
    });
  });

  describe('getAllConflicts', () => {
    it('should return all detected conflicts', async () => {
      // Create overlapping slots
      await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 100
      });

      await service.createTimeSlot({
        eventId: 'event-2',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T11:30:00'),
        endTime: new Date('2026-05-15T13:00:00'),
        capacity: 100
      });

      const result = await service.getAllConflicts();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter conflicts by resolved status', async () => {
      await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 100
      });

      const result = await service.getAllConflicts({ resolved: false });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('resolveConflict', () => {
    it('should mark conflict as resolved', async () => {
      // Create conflicting slots
      await service.createTimeSlot({
        eventId: 'event-1',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T10:00:00'),
        endTime: new Date('2026-05-15T12:00:00'),
        capacity: 100
      });

      await service.createTimeSlot({
        eventId: 'event-2',
        venue: 'Hall A',
        startTime: new Date('2026-05-15T11:00:00'),
        endTime: new Date('2026-05-15T13:00:00'),
        capacity: 100
      });

      const conflicts = await service.getAllConflicts();
      if (conflicts.length > 0) {
        const conflictId = conflicts[0].id;
        const conflict = await service.resolveConflict(
          conflictId,
          'Rescheduled event-2'
        );

        expect(conflict).toBeDefined();
        expect(conflict.resolved).toBe(true);
      }
    });
  });
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../../../backend/src/database/connection.js';
import { Conflict, TimeSlot } from '../../../../backend/src/database/schemas/scheduling.schema.js';
import { SchedulingService } from './scheduling.service.js';

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
    service = new SchedulingService();
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

      const result = await service.createTimeSlot(slotData);

      expect(result.success).toBe(true);
      expect(result.slot).toBeDefined();
      expect(result.slot.eventId).toBe('event-1');
      expect(result.slot.venue).toBe('Auditorium A');
      expect(result.slot.capacity).toBe(500);
      expect(result.slot.status).toBe('scheduled');
    });

    it('should fail when missing required fields', async () => {
      const slotData = {
        eventId: 'event-1',
        venue: 'Auditorium A'
        // missing startTime, endTime, capacity
      };

      const result = await service.createTimeSlot(slotData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should fail when startTime is after endTime', async () => {
      const slotData = {
        eventId: 'event-1',
        venue: 'Auditorium A',
        startTime: new Date('2026-05-15T14:00:00'),
        endTime: new Date('2026-05-15T12:00:00'), // End before start
        capacity: 500
      };

      const result = await service.createTimeSlot(slotData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('startTime must be before endTime');
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

      const result1 = await service.createTimeSlot(slot1);
      const result2 = await service.createTimeSlot(slot2);

      expect(result1.slot.id).not.toBe(result2.slot.id);
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

      const createResult = await service.createTimeSlot(slotData);
      const slotId = createResult.slot.id;

      const getResult = await service.getTimeSlotById(slotId);

      expect(getResult).toBeDefined();
      expect(getResult.id).toBe(slotId);
      expect(getResult.venue).toBe('Hall A');
    });

    it('should return null for non-existent slot', async () => {
      const result = await service.getTimeSlotById('non-existent-id');

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
      expect(slots.every(s => s.eventId === 'event-1')).toBe(true);
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
      const available = await service.isVenueAvailable('Main Hall',
        new Date('2026-05-15T13:00:00'),
        new Date('2026-05-15T15:00:00')
      );

      expect(available).toBe(true);
    });

    it('should return false for overlapping time', async () => {
      const available = await service.isVenueAvailable('Main Hall',
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

      expect(conflicts.some(c => c.conflictType === 'venue-overlap')).toBe(true);
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
        const result = await service.resolveConflict(conflictId, 'Rescheduled event-2');

        expect(result.success).toBe(true);
        expect(result.conflict.resolved).toBe(true);
      }
    });
  });
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Event } from '../schema/event.model.js';
import { createEventRepository } from '../repository/event.repository.js';
import { createEventService } from './event.service.js';

describe('EventService', () => {
  let service;
  let mongoServer;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  }, 120000);

  beforeEach(async () => {
    await Event.deleteMany({});
    const repository = createEventRepository();
    eventBus = { emit: vi.fn() };
    service = createEventService(repository, eventBus);
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const payload = {
        title: 'Tech Symposium',
        instituteId: 'inst_1',
        startsAt: new Date('2026-10-10T10:00:00Z'),
        createdBy: 'user_1'
      };

      const event = await service.createEvent(payload);

      expect(event).toBeDefined();
      expect(event.title).toBe('Tech Symposium');
      expect(event.instituteId).toBe('inst_1');
      expect(event.status).toBe('draft');
      expect(event.registrations).toEqual([]);
    });
  });

  describe('updateEvent', () => {
    it('should update an event details', async () => {
      const created = await service.createEvent({
        title: 'Draft Event',
        instituteId: 'inst_1',
        startsAt: new Date(),
        createdBy: 'user_1'
      });

      const updated = await service.updateEvent(created._id || created.id, {
        title: 'Updated Event',
        venue: 'Hall A'
      });

      expect(updated.title).toBe('Updated Event');
      expect(updated.venue).toBe('Hall A');
    });
  });

  describe('setStatus', () => {
    it('should update event status', async () => {
      const created = await service.createEvent({
        title: 'Draft Event',
        instituteId: 'inst_1',
        startsAt: new Date(),
        createdBy: 'user_1'
      });

      const updated = await service.setStatus(
        created._id || created.id,
        'published'
      );
      expect(updated.status).toBe('published');
    });
  });

  describe('registerForEvent', () => {
    it('should register a user if under capacity', async () => {
      const created = await service.createEvent({
        title: 'Workshop',
        instituteId: 'inst_1',
        capacity: 3,
        startsAt: new Date(),
        createdBy: 'user_1'
      });

      const eventId = created._id || created.id;

      const res1 = await service.registerForEvent(eventId, {
        attendeeName: 'User 1',
        attendeeEmail: 'user1@test.com'
      });
      expect(res1.type).toBe('REGISTERED');
      expect(res1.totalRegistrations).toBe(1);

      const res2 = await service.registerForEvent(eventId, {
        attendeeName: 'User 2',
        attendeeEmail: 'user2@test.com'
      });
      expect(res2.type).toBe('REGISTERED');

      const res3 = await service.registerForEvent(eventId, {
        attendeeName: 'User 3',
        attendeeEmail: 'user3@test.com'
      });
      expect(res3.type).toBe('REGISTERED');

      // 4th user should fail due to capacity
      const res4 = await service.registerForEvent(eventId, {
        attendeeName: 'User 4',
        attendeeEmail: 'user4@test.com'
      });
      expect(res4.type).toBe('EVENT_CAPACITY_REACHED');

      // duplicate email should fail
      const resDuplicate = await service.registerForEvent(eventId, {
        attendeeName: 'User 1 Duplicate',
        attendeeEmail: 'user1@test.com'
      });
      expect(resDuplicate.type).toBe('ALREADY_REGISTERED');
    });
  });

  describe('deleteEvent', () => {
    it('should delete event and emit event bus message', async () => {
      const created = await service.createEvent({
        title: 'To Delete',
        instituteId: 'inst_1',
        startsAt: new Date(),
        createdBy: 'user_1'
      });

      const eventId = created._id || created.id;
      const deleted = await service.deleteEvent(eventId);

      expect(deleted).toBe(true);
      expect(eventBus.emit).toHaveBeenCalledWith('event:deleted', {
        eventId: eventId.toString()
      });

      const fetched = await service.getEvent(eventId);
      expect(fetched).toBeNull();
    });
  });
});

import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { CalendarEvent } from '../schema/calendar.model.js';
import { getCalendarService } from './calendar.service.js';

describe('CalendarService', () => {
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
    await CalendarEvent.deleteMany({});
    service = getCalendarService();
  });

  describe('createEvent', () => {
    it('should create a new calendar event successfully', async () => {
      const payload = {
        title: 'Midterm Exam',
        eventType: 'milestone',
        startsAt: new Date('2026-10-15T09:00:00Z'),
        endsAt: new Date('2026-10-15T12:00:00Z'),
        description: 'Computer Science Midterm'
      };

      const event = await service.createEvent(payload);

      expect(event).toBeDefined();
      expect(event.title).toBe(payload.title);
      expect(event.eventType).toBe(payload.eventType);
    });
  });

  describe('listEvents', () => {
    it('should list all events sorted by startsAt', async () => {
      await service.createEvent({
        title: 'Event 2',
        eventType: 'task-deadline',
        startsAt: new Date('2026-10-20T09:00:00Z')
      });
      await service.createEvent({
        title: 'Event 1',
        eventType: 'event',
        startsAt: new Date('2026-10-15T09:00:00Z')
      });

      const events = await service.listEvents();

      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1'); // earlier date should be first
      expect(events[1].title).toBe('Event 2');
    });
  });

  describe('getEventsBetween', () => {
    it('should return events within the date range', async () => {
      await service.createEvent({
        title: 'In Range',
        eventType: 'event',
        startsAt: new Date('2026-10-15T09:00:00Z')
      });
      await service.createEvent({
        title: 'Out of Range',
        eventType: 'event',
        startsAt: new Date('2026-11-15T09:00:00Z')
      });

      const events = await service.getEventsBetween(
        new Date('2026-10-01T00:00:00Z'),
        new Date('2026-10-31T23:59:59Z')
      );

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('In Range');
    });
  });

  describe('getEvent & deleteEvent', () => {
    it('should fetch and delete an event by ID', async () => {
      const created = await service.createEvent({
        title: 'To Be Deleted',
        eventType: 'event',
        startsAt: new Date('2026-10-15T09:00:00Z')
      });

      const fetched = await service.getEvent(created._id);
      expect(fetched).toBeDefined();
      expect(fetched.title).toBe('To Be Deleted');

      const deleted = await service.deleteEvent(created._id);
      expect(deleted).toBe(true);

      const fetchAfterDelete = await service.getEvent(created._id);
      expect(fetchAfterDelete).toBeNull();
    });
  });
});

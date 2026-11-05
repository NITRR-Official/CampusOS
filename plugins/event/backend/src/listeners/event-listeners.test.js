import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { Event } from '../schema/event.model.js';
import { EventRegistration } from '../schema/event-registration.model.js';
import { createEventService } from '../service/event.service.js';
import { createEventRepository } from '../repository/event.repository.js';
import { registerEventHandlers } from './index.js';

describe('Event Listeners (Integration)', () => {
  let mongoServer;
  let eventService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    eventBus = new EventEmitter();
    const eventRepo = createEventRepository();
    eventService = createEventService(eventRepo, eventBus);

    registerEventHandlers(eventBus, {}, eventService);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Event.deleteMany({});
    await EventRegistration.deleteMany({});
  });

  describe('club:deleted listener', () => {
    it('should delete all events and registrations associated with the deleted club', async () => {
      const clubId = new mongoose.Types.ObjectId().toString();
      const otherClubId = new mongoose.Types.ObjectId().toString();
      const instituteId = new mongoose.Types.ObjectId().toString();
      const createdBy = new mongoose.Types.ObjectId().toString();

      const ev1 = await eventService.createEvent({
        title: 'Event 1',
        clubId,
        instituteId,
        startsAt: new Date(),
        createdBy
      });

      const ev2 = await eventService.createEvent({
        title: 'Event 2',
        clubId,
        instituteId,
        startsAt: new Date(),
        createdBy
      });

      await eventService.createEvent({
        title: 'Other Club Event',
        clubId: otherClubId,
        instituteId,
        startsAt: new Date(),
        createdBy
      });

      await eventService.registerForEvent(ev1._id, {
        attendeeName: 'User 1',
        attendeeEmail: 'user1@test.com',
        userId: 'user-1'
      });

      const eventsBefore = await Event.find({ clubId });
      expect(eventsBefore.length).toBe(2);

      const regBefore = await EventRegistration.find({ eventId: ev1._id });
      expect(regBefore.length).toBe(1);

      eventBus.emit('club:deleted', { clubId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const eventsAfter = await Event.find({ clubId });
      expect(eventsAfter.length).toBe(0);

      const regAfter = await EventRegistration.find({ eventId: ev1._id });
      expect(regAfter.length).toBe(0);

      const otherEvents = await Event.find({ clubId: otherClubId });
      expect(otherEvents.length).toBe(1);
    });
  });

  describe('user:deleted listener', () => {
    it('should cancel registrations for the deleted user and decrement count', async () => {
      const clubId = new mongoose.Types.ObjectId().toString();
      const instituteId = new mongoose.Types.ObjectId().toString();
      const createdBy = new mongoose.Types.ObjectId().toString();

      const ev = await eventService.createEvent({
        title: 'Workshop',
        clubId,
        instituteId,
        startsAt: new Date(),
        createdBy
      });

      await eventService.registerForEvent(ev._id, {
        attendeeName: 'Target User',
        attendeeEmail: 'target@test.com',
        userId: 'user-to-delete-123'
      });

      await eventService.registerForEvent(ev._id, {
        attendeeName: 'Other User',
        attendeeEmail: 'other@test.com',
        userId: 'other-user-456'
      });

      const evBefore = await Event.findById(ev._id);
      expect(evBefore.registrationsCount).toBe(2);

      eventBus.emit('user:deleted', { userId: 'user-to-delete-123' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const evAfter = await Event.findById(ev._id);
      expect(evAfter.registrationsCount).toBe(1);

      const remainingRegs = await EventRegistration.find({ eventId: ev._id });
      expect(remainingRegs.length).toBe(1);
      expect(remainingRegs[0].userId).toBe('other-user-456');
    });
  });
});

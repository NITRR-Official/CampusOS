import crypto from 'node:crypto';

const eventsById = new Map();

class EventService {
  createEvent(payload) {
    const event = {
      id: crypto.randomUUID(),
      title: payload.title,
      description: payload.description || null,
      instituteId: payload.instituteId,
      clubId: payload.clubId || null,
      venue: payload.venue || null,
      capacity: payload.capacity || null,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt || null,
      status: 'draft',
      registrations: [],
      createdBy: payload.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    eventsById.set(event.id, event);
    return event;
  }

  updateEvent(eventId, updates) {
    const event = eventsById.get(eventId);

    if (!event) {
      return null;
    }

    Object.assign(event, updates, { updatedAt: new Date().toISOString() });
    return event;
  }

  getEvent(eventId) {
    return eventsById.get(eventId) || null;
  }

  setStatus(eventId, status) {
    const event = eventsById.get(eventId);

    if (!event) {
      return null;
    }

    event.status = status;
    event.updatedAt = new Date().toISOString();
    return event;
  }

  listEvents() {
    return Array.from(eventsById.values());
  }

  registerForEvent(eventId, registrationPayload) {
    const event = eventsById.get(eventId);

    if (!event) {
      return { type: 'EVENT_NOT_FOUND' };
    }

    if (
      event.capacity !== null &&
      event.registrations.length >= event.capacity
    ) {
      return { type: 'EVENT_CAPACITY_REACHED' };
    }

    const existing = event.registrations.find(
      (registration) =>
        registration.attendeeEmail === registrationPayload.attendeeEmail
    );

    if (existing) {
      return { type: 'ALREADY_REGISTERED' };
    }

    const registration = {
      id: crypto.randomUUID(),
      attendeeName: registrationPayload.attendeeName,
      attendeeEmail: registrationPayload.attendeeEmail,
      createdAt: new Date().toISOString()
    };

    event.registrations.push(registration);
    event.updatedAt = new Date().toISOString();

    return {
      type: 'REGISTERED',
      registration,
      totalRegistrations: event.registrations.length
    };
  }
}

const eventService = new EventService();

export function getEventService() {
  return eventService;
}

export default getEventService;

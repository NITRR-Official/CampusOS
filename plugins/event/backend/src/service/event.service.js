import crypto from 'node:crypto';

export function createEventService(eventRepository) {
  async function createEvent(payload) {
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

    await eventRepository.saveEvent(event);
    return event;
  }

  async function updateEvent(eventId, updates) {
    const event = await eventRepository.getEventById(eventId);

    if (!event) {
      return null;
    }

    Object.assign(event, updates, { updatedAt: new Date().toISOString() });
    await eventRepository.saveEvent(event);
    return event;
  }

  async function getEvent(eventId) {
    return eventRepository.getEventById(eventId);
  }

  async function setStatus(eventId, status) {
    const event = await eventRepository.getEventById(eventId);

    if (!event) {
      return null;
    }

    event.status = status;
    event.updatedAt = new Date().toISOString();
    await eventRepository.saveEvent(event);
    return event;
  }

  async function listEvents() {
    return eventRepository.listEvents();
  }

  async function registerForEvent(eventId, registrationPayload) {
    const event = await eventRepository.getEventById(eventId);

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
    
    await eventRepository.saveEvent(event);

    return {
      type: 'REGISTERED',
      registration,
      totalRegistrations: event.registrations.length
    };
  }

  return {
    createEvent,
    updateEvent,
    getEvent,
    setStatus,
    listEvents,
    registerForEvent
  };
}

export default createEventService;

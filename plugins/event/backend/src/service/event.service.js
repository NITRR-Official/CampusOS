import crypto from 'node:crypto';

export function createEventService(eventRepository, eventBus) {
  async function createEvent(payload) {
    const event = {
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

    const savedEvent = await eventRepository.saveEvent(event);

    if (eventBus) {
      eventBus.emit('event:created', {
        eventId: savedEvent._id || savedEvent.id,
        clubId: savedEvent.clubId,
        actorId: savedEvent.createdBy,
        title: savedEvent.title
      });
    }

    return savedEvent;
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

    if (eventBus && status === 'published') {
      eventBus.emit('event:published', {
        eventId: event._id || event.id,
        clubId: event.clubId,
        actorId: event.createdBy,
        title: event.title
      });
    }

    return event;
  }

  async function listEvents(clubId) {
    return eventRepository.listEvents(clubId);
  }

  async function registerForEvent(eventId, registrationPayload) {
    const event = await eventRepository.getEventById(eventId);

    if (!event) {
      return { type: 'EVENT_NOT_FOUND' };
    }

    const existing = event.registrations.find(
      (registration) =>
        registration.attendeeEmail === registrationPayload.attendeeEmail
    );

    if (existing) {
      return { type: 'ALREADY_REGISTERED' };
    }

    if (
      event.capacity !== null &&
      event.registrations.length >= event.capacity
    ) {
      return { type: 'EVENT_CAPACITY_REACHED' };
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

  async function deleteEvent(eventId) {
    const deleted = await eventRepository.deleteEvent(eventId);
    if (deleted && eventBus) {
      eventBus.emit('event:deleted', { eventId });
    }
    return deleted;
  }

  async function deleteEventsByClub(clubId) {
    const events = await eventRepository.getEventsByClub(clubId);
    let count = 0;

    for (const event of events) {
      const deleted = await deleteEvent(event._id || event.id);
      if (deleted) count++;
    }

    return count;
  }

  return {
    createEvent,
    updateEvent,
    getEvent,
    setStatus,
    listEvents,
    registerForEvent,
    deleteEvent,
    deleteEventsByClub
  };
}

export default createEventService;

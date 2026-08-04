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
      createdBy: payload.createdBy
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
    const allowedFields = [
      'title',
      'description',
      'venue',
      'capacity',
      'startsAt',
      'endsAt'
    ];
    const safeUpdates = { _id: eventId };

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    if (Object.keys(safeUpdates).length === 1) {
      return eventRepository.getEventById(eventId);
    }

    return eventRepository.saveEvent(safeUpdates);
  }

  async function getEvent(eventId) {
    return eventRepository.getEventById(eventId);
  }

  async function setStatus(eventId, status) {
    const updatedEvent = await eventRepository.saveEvent({
      _id: eventId,
      status
    });

    if (!updatedEvent) {
      return null;
    }

    if (eventBus && status === 'published') {
      eventBus.emit('event:published', {
        eventId: updatedEvent._id || updatedEvent.id,
        clubId: updatedEvent.clubId,
        actorId: updatedEvent.createdBy,
        title: updatedEvent.title
      });
    }

    return updatedEvent;
  }

  async function listEvents(clubId, options = {}) {
    return eventRepository.listEvents(clubId, options);
  }

  async function listPublicEvents(clubId) {
    return eventRepository.listPublicEvents(clubId);
  }

  async function getPublicEventById(eventId) {
    return eventRepository.getPublicEventById(eventId);
  }

  async function registerForEvent(eventId, registrationPayload) {
    const event = await eventRepository.getEventById(eventId);

    if (!event) {
      return { type: 'EVENT_NOT_FOUND' };
    }

    // Atomically increment count first (enforces capacity)
    const updatedEvent = await eventRepository.incrementRegistrationCount(
      eventId,
      1,
      event.capacity
    );

    if (!updatedEvent) {
      // If updatedEvent is null, it means the query didn't match (capacity reached)
      return { type: 'EVENT_CAPACITY_REACHED' };
    }

    try {
      // Create the registration record
      // If this email is already registered, it will throw a duplicate key error (code 11000)
      const registrationData = {
        eventId,
        attendeeName: registrationPayload.attendeeName,
        attendeeEmail: registrationPayload.attendeeEmail,
        userId: registrationPayload.userId || null
      };

      const registration =
        await eventRepository.createRegistration(registrationData);

      return {
        type: 'REGISTERED',
        registration,
        totalRegistrations: updatedEvent.registrationsCount
      };
    } catch (error) {
      // Rollback the counter on ANY failure (including duplicate registration)
      await eventRepository.incrementRegistrationCount(eventId, -1, null);

      if (error.code === 11000) {
        return { type: 'ALREADY_REGISTERED' };
      }
      throw error;
    }
  }

  async function deleteEvent(eventId) {
    const deleted = await eventRepository.deleteEvent(eventId);
    if (deleted && eventBus) {
      eventBus.emit('event:deleted', { eventId });
    }
    return deleted;
  }

  async function getEventRegistrations(eventId) {
    return eventRepository.findRegistrationsByEvent(eventId);
  }

  async function deleteEventsByClub(clubId) {
    const events = await eventRepository.getEventsByClub(clubId);

    const results = await Promise.all(
      events.map((event) => deleteEvent(event._id || event.id))
    );

    return results.filter(Boolean).length;
  }

  return {
    createEvent,
    updateEvent,
    getEvent,
    setStatus,
    listEvents,
    listPublicEvents,
    getPublicEventById,
    registerForEvent,
    deleteEvent,
    deleteEventsByClub,
    getEventRegistrations
  };
}

export default createEventService;

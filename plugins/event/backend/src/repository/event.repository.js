export function createEventRepository() {
  const eventsById = new Map();

  async function saveEvent(event) {
    eventsById.set(event.id, event);
    return event;
  }

  async function getEventById(eventId) {
    return eventsById.get(eventId) || null;
  }

  async function listEvents() {
    return Array.from(eventsById.values());
  }

  return {
    saveEvent,
    getEventById,
    listEvents
  };
}

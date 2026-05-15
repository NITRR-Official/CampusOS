import crypto from 'node:crypto';
// TODO - DB implementation in this plugin
const calendarEventsById = new Map();

class CalendarService {
  createEvent(payload) {
    const event = {
      id: crypto.randomUUID(),
      title: payload.title,
      eventType: payload.eventType,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt || null,
      description: payload.description || null,
      linkedTaskId: payload.linkedTaskId || null,
      linkedEventId: payload.linkedEventId || null,
      createdBy: payload.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    calendarEventsById.set(event.id, event);
    return event;
  }

  listEvents() {
    return Array.from(calendarEventsById.values()).sort((left, right) => {
      return Date.parse(left.startsAt) - Date.parse(right.startsAt);
    });
  }

  getEventsBetween(startDate, endDate) {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);

    return Array.from(calendarEventsById.values())
      .filter((event) => {
        const eventStart = Date.parse(event.startsAt);
        return eventStart >= start && eventStart <= end;
      })
      .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
  }

  getEvent(eventId) {
    return calendarEventsById.get(eventId) || null;
  }

  deleteEvent(eventId) {
    return calendarEventsById.delete(eventId);
  }
}

const calendarService = new CalendarService();

export function getCalendarService() {
  return calendarService;
}

export default getCalendarService;

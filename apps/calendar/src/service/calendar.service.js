import { CalendarEvent } from '../schema/calendar.model.js';

/**
 * Convert a date-like value to an ISO 8601 string.
 * Returns null for nullish values so nullable date fields are preserved.
 */
function toIso(value) {
  if (value == null) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

/**
 * Map a Mongoose document (or `.lean()` object) to the API response shape.
 * Maps `_id -> id`, emits exactly the 11 documented keys, converts Date fields
 * to ISO 8601 strings, and preserves null for nullable fields.
 */
function serializeEvent(doc) {
  if (!doc) {
    return null;
  }

  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  return {
    id: obj._id,
    title: obj.title,
    eventType: obj.eventType,
    startsAt: toIso(obj.startsAt),
    endsAt: toIso(obj.endsAt),
    description: obj.description ?? null,
    linkedTaskId: obj.linkedTaskId ?? null,
    linkedEventId: obj.linkedEventId ?? null,
    createdBy: obj.createdBy,
    createdAt: toIso(obj.createdAt),
    updatedAt: toIso(obj.updatedAt)
  };
}

class CalendarService {
  async createEvent(payload) {
    const doc = await CalendarEvent.create({
      title: payload.title,
      eventType: payload.eventType,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt ?? null,
      description: payload.description ?? null,
      linkedTaskId: payload.linkedTaskId ?? null,
      linkedEventId: payload.linkedEventId ?? null,
      createdBy: payload.createdBy
    });

    return serializeEvent(doc);
  }

  async listEvents() {
    const docs = await CalendarEvent.find()
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return docs.map(serializeEvent);
  }

  async getEventsBetween(startDate, endDate) {
    const docs = await CalendarEvent.find({
      startsAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .sort({ startsAt: 1, _id: 1 })
      .lean();

    return docs.map(serializeEvent);
  }

  async getEvent(eventId) {
    if (!eventId) {
      return null;
    }

    const doc = await CalendarEvent.findById(eventId).lean();
    return serializeEvent(doc);
  }

  async deleteEvent(eventId) {
    if (!eventId) {
      return false;
    }

    const result = await CalendarEvent.deleteOne({ _id: eventId });
    return result.deletedCount > 0;
  }
}

const calendarService = new CalendarService();

export function getCalendarService() {
  return calendarService;
}

export default getCalendarService;

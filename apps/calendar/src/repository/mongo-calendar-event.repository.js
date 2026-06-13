/**
 * MongoDB Calendar Event Repository Adapter
 *
 * Concrete MongoDB implementation of the {@link CalendarEventRepository}
 * persistence contract (GitHub issue #44, sub-issue of #22). This adapter is
 * the single place where the storage-agnostic repository interface is bound to
 * the Mongoose {@link CalendarEvent} model.
 *
 * Behaviour notes
 * ---------------
 *  - NORMALIZATION: every method that resolves with an event resolves with the
 *    normalized 11-key domain object (see `serializeEvent`), never a raw
 *    Mongoose document. `_id` is mapped to `id` and all Date fields are emitted
 *    as ISO 8601 strings, with nulls preserved for nullable fields.
 *  - ERROR PROPAGATION: this adapter does NOT swallow database errors. Any
 *    failure from the underlying driver/model rejects the returned promise so
 *    it can be handled upstream (by the service/controller layer).
 */

import { CalendarEvent } from '../schema/calendar.model.js';
import { CalendarEventRepository } from './calendar-event.repository.js';

/**
 * Convert a date-like value to an ISO 8601 string.
 * Returns null for nullish values so nullable date fields are preserved.
 *
 * @param {Date|string|number|null|undefined} value
 * @returns {string|null}
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
 * Map a Mongoose document (or `.lean()` object) to the normalized domain shape.
 * Maps `_id -> id`, emits exactly the 11 documented keys, converts Date fields
 * to ISO 8601 strings, and preserves null for nullable fields. Returns null for
 * nullish input.
 *
 * @param {Object|null|undefined} doc
 * @returns {import('./calendar-event.repository.js').CalendarEvent|null}
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

/**
 * Concrete MongoDB-backed implementation of {@link CalendarEventRepository}.
 *
 * Database failures are NOT caught here; they propagate (reject) to be handled
 * upstream.
 *
 * @augments CalendarEventRepository
 */
export class MongoCalendarEventRepository extends CalendarEventRepository {
  /**
   * Persist a new calendar event.
   *
   * @param {import('./calendar-event.repository.js').CreateCalendarEventPayload} payload
   * @returns {Promise<import('./calendar-event.repository.js').CalendarEvent>}
   */
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

  /**
   * Retrieve a single event by its identifier.
   *
   * @param {string} id
   * @returns {Promise<import('./calendar-event.repository.js').CalendarEvent|null>}
   */
  async getEventById(id) {
    if (!id) {
      return null;
    }

    return serializeEvent(await CalendarEvent.findById(id).lean());
  }

  /**
   * List all calendar events, ordered by `startsAt` then `_id` ascending.
   *
   * @returns {Promise<import('./calendar-event.repository.js').CalendarEvent[]>}
   */
  async listEvents() {
    const docs = await CalendarEvent.find()
      .sort({ startsAt: 1, _id: 1 })
      .lean();

    return docs.map(serializeEvent);
  }

  /**
   * Query events whose `startsAt` falls within an inclusive date range,
   * ordered by `startsAt` then `_id` ascending.
   *
   * @param {string|Date} startDate
   * @param {string|Date} endDate
   * @returns {Promise<import('./calendar-event.repository.js').CalendarEvent[]>}
   */
  async queryEventsByRange(startDate, endDate) {
    const docs = await CalendarEvent.find({
      startsAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .sort({ startsAt: 1, _id: 1 })
      .lean();

    return docs.map(serializeEvent);
  }

  /**
   * Apply partial changes to an existing event.
   *
   * @param {string} id
   * @param {import('./calendar-event.repository.js').UpdateCalendarEventChanges} changes
   * @returns {Promise<import('./calendar-event.repository.js').CalendarEvent|null>}
   */
  async updateEvent(id, changes) {
    if (!id) {
      return null;
    }

    const result = await CalendarEvent.findByIdAndUpdate(
      id,
      { $set: changes },
      { new: true, runValidators: true }
    ).lean();

    return serializeEvent(result);
  }

  /**
   * Remove an event by its identifier.
   *
   * @param {string} id
   * @returns {Promise<boolean>} `true` when an event was removed, else `false`.
   */
  async deleteEvent(id) {
    if (!id) {
      return false;
    }

    const result = await CalendarEvent.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export default MongoCalendarEventRepository;

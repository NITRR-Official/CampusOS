/**
 * Calendar Event Repository Abstraction
 *
 * Storage-agnostic persistence contract for calendar events (GitHub issue #43,
 * sub-issue of #22). This module defines the boundary between calendar workflow
 * services (issue #45) and whatever database technology actually stores the
 * data (the MongoDB adapter is issue #44).
 *
 * Architectural intent
 * --------------------
 *  - SEPARATION OF CONCERNS: workflow/service code depends only on this
 *    abstraction, never on a concrete database driver. Persistence details
 *    (Mongoose, an in-memory store, SQL, etc.) live behind a subclass.
 *  - DATABASE PORTABILITY: swapping the storage engine means writing a new
 *    subclass that implements these methods; no service/controller code needs
 *    to change.
 *  - TESTABILITY: because services depend on this interface, tests can supply a
 *    lightweight fake/mock repository (or a subclass backed by an in-memory
 *    array) without spinning up a real database.
 *
 * Since this is plain JavaScript with no native interfaces, the "interface" is
 * modelled as an abstract base class. Every method throws a clear
 * "not implemented" error so that:
 *   1. A subclass that forgets to override a method fails loudly and early.
 *   2. The contract (method names, parameters, return shapes) is documented in
 *      one authoritative place.
 *
 * This module is intentionally storage-agnostic: it does NOT import mongoose,
 * the Mongoose model, or any other persistence library.
 *
 * Normalized event domain object
 * -------------------------------
 * All read/write methods that resolve with an event resolve with a normalized
 * domain object (NOT a raw database document). The normalized shape uses `id`
 * (never the database-native `_id`) and ISO 8601 date strings for all
 * date-time fields:
 *
 * @typedef {Object} CalendarEvent
 * @property {string} id            Unique identifier (domain `id`, not `_id`).
 * @property {string} title         Event title.
 * @property {('task-deadline'|'event'|'milestone')} eventType  Event type.
 * @property {string} startsAt      Start date-time as an ISO 8601 string.
 * @property {string|null} endsAt   End date-time as an ISO 8601 string, or null.
 * @property {string|null} description  Free-text description, or null.
 * @property {string|null} linkedTaskId   Linked task id, or null.
 * @property {string|null} linkedEventId  Linked event id, or null.
 * @property {string} createdBy     Identifier of the creator.
 * @property {string} createdAt     Creation timestamp as an ISO 8601 string.
 * @property {string} updatedAt     Last-update timestamp as an ISO 8601 string.
 *
 * Payload for creating an event.
 *
 * @typedef {Object} CreateCalendarEventPayload
 * @property {string} title         Event title.
 * @property {('task-deadline'|'event'|'milestone')} eventType  Event type.
 * @property {string} startsAt      Start date-time (ISO 8601 string).
 * @property {string|null} [endsAt] Optional end date-time (ISO 8601 string).
 * @property {string|null} [description]    Optional description.
 * @property {string|null} [linkedTaskId]   Optional linked task id.
 * @property {string|null} [linkedEventId]  Optional linked event id.
 * @property {string} createdBy     Identifier of the creator.
 *
 * Partial set of mutable fields for updating an event. Any subset of the
 * editable fields may be supplied; omitted fields are left unchanged.
 *
 * @typedef {Partial<Omit<CreateCalendarEventPayload, 'createdBy'>>} UpdateCalendarEventChanges
 */

/**
 * Abstract base class declaring the calendar event persistence contract.
 *
 * Concrete adapters (e.g. a MongoDB-backed repository) extend this class and
 * override every method. Consumers (services) should depend on this type, not
 * on a concrete subclass, so the storage engine remains swappable and mockable.
 *
 * @abstract
 */
export class CalendarEventRepository {
  /**
   * Persist a new calendar event.
   *
   * @abstract
   * @param {CreateCalendarEventPayload} payload The event to create.
   * @returns {Promise<CalendarEvent>} Resolves with the created event as a
   *   normalized domain object (with `id` and ISO 8601 date strings).
   * @throws {Error} In the base class, always — must be implemented by a subclass.
   */
  // eslint-disable-next-line no-unused-vars
  async createEvent(payload) {
    throw new Error(
      'CalendarEventRepository.createEvent must be implemented by a subclass'
    );
  }

  /**
   * Retrieve a single event by its identifier.
   *
   * @abstract
   * @param {string} id The domain identifier of the event.
   * @returns {Promise<CalendarEvent|null>} Resolves with the matching
   *   normalized event, or `null` when no event has the given id.
   * @throws {Error} In the base class, always — must be implemented by a subclass.
   */
  // eslint-disable-next-line no-unused-vars
  async getEventById(id) {
    throw new Error(
      'CalendarEventRepository.getEventById must be implemented by a subclass'
    );
  }

  /**
   * List all calendar events.
   *
   * Results are ordered by `startsAt` ascending, then by `id` ascending as a
   * stable tie-breaker.
   *
   * @abstract
   * @returns {Promise<CalendarEvent[]>} Resolves with all events as normalized
   *   domain objects, in ascending order. Resolves with an empty array when
   *   there are no events.
   * @throws {Error} In the base class, always — must be implemented by a subclass.
   */
  async listEvents() {
    throw new Error(
      'CalendarEventRepository.listEvents must be implemented by a subclass'
    );
  }

  /**
   * Query events whose `startsAt` falls within an inclusive date range.
   *
   * The range is inclusive on both ends: an event is included when
   * `startDate <= event.startsAt <= endDate`. Results are ordered by `startsAt`
   * ascending, then by `id` ascending as a stable tie-breaker.
   *
   * @abstract
   * @param {string|Date} startDate Inclusive start of the range (ISO 8601
   *   string or Date).
   * @param {string|Date} endDate Inclusive end of the range (ISO 8601 string
   *   or Date).
   * @returns {Promise<CalendarEvent[]>} Resolves with the matching events as
   *   normalized domain objects, in ascending order. Resolves with an empty
   *   array when nothing matches.
   * @throws {Error} In the base class, always — must be implemented by a subclass.
   */
  // eslint-disable-next-line no-unused-vars
  async queryEventsByRange(startDate, endDate) {
    throw new Error(
      'CalendarEventRepository.queryEventsByRange must be implemented by a subclass'
    );
  }

  /**
   * Apply partial changes to an existing event.
   *
   * Only the fields present in `changes` are modified; omitted fields are left
   * unchanged. This method is part of the repository contract to support future
   * event editing (forward-looking for issue #23) even though the current
   * service does not yet expose an update operation.
   *
   * @abstract
   * @param {string} id The domain identifier of the event to update.
   * @param {UpdateCalendarEventChanges} changes Partial set of fields to apply.
   * @returns {Promise<CalendarEvent|null>} Resolves with the updated event as a
   *   normalized domain object, or `null` when no event has the given id.
   * @throws {Error} In the base class, always — must be implemented by a subclass.
   */
  // eslint-disable-next-line no-unused-vars
  async updateEvent(id, changes) {
    throw new Error(
      'CalendarEventRepository.updateEvent must be implemented by a subclass'
    );
  }

  /**
   * Remove an event by its identifier.
   *
   * @abstract
   * @param {string} id The domain identifier of the event to delete.
   * @returns {Promise<boolean>} Resolves with `true` when an event was removed,
   *   or `false` when no event had the given id.
   * @throws {Error} In the base class, always — must be implemented by a subclass.
   */
  // eslint-disable-next-line no-unused-vars
  async deleteEvent(id) {
    throw new Error(
      'CalendarEventRepository.deleteEvent must be implemented by a subclass'
    );
  }
}

export default CalendarEventRepository;

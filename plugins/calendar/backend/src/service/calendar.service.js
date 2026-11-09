import { MongoCalendarEventRepository } from '../repository/mongo-calendar-event.repository.js';

/**
 * Calendar workflow service (GitHub issue #45, sub-issue of #22).
 *
 * This service depends on the storage-agnostic
 * {@link import('../repository/calendar-event.repository.js').CalendarEventRepository}
 * abstraction rather than on a database driver directly. It owns no persistence
 * or normalization logic of its own; every public method delegates to the
 * injected repository, which is responsible for talking to the underlying store
 * and returning normalized domain objects (`id` + ISO 8601 date strings).
 *
 * The repository is injected via the constructor so the service can be tested
 * with a fake/mock repository (issue #46) without a real database. By default
 * it uses the MongoDB-backed adapter.
 *
 * The one rule the service enforces itself is the update date range: when a
 * partial update changes only `startsAt` or only `endsAt`, the resulting range
 * can only be checked against the stored event (issue #23).
 *
 * Repository rejections are intentionally NOT caught here; they propagate to the
 * controller layer, which is responsible for error handling.
 */
export class CalendarService {
  /**
   * @param {import('../repository/calendar-event.repository.js').CalendarEventRepository} [repository]
   *   The persistence adapter to delegate to. Defaults to a new
   *   {@link MongoCalendarEventRepository}.
   */
  constructor(repository = new MongoCalendarEventRepository()) {
    this.repository = repository;
  }

  async createEvent(payload) {
    return this.repository.createEvent(payload);
  }

  async listEvents() {
    return this.repository.listEvents();
  }

  async getEventsBetween(startDate, endDate) {
    return this.repository.queryEventsByRange(startDate, endDate);
  }

  async getEvent(eventId) {
    return this.repository.getEventById(eventId);
  }

  /**
   * Apply validated partial changes to an event.
   *
   * @param {string} eventId
   * @param {import('../repository/calendar-event.repository.js').UpdateCalendarEventChanges} changes
   * @returns {Promise<import('../repository/calendar-event.repository.js').CalendarEvent|null>}
   *   The updated event, or `null` when no event has the given id.
   * @throws {Error} A 400 validation error when the merged date range would
   *   end before it starts.
   */
  async updateEvent(eventId, changes) {
    if (needsStoredDateRange(changes)) {
      const existing = await this.repository.getEventById(eventId);

      if (!existing) {
        return null;
      }

      const startsAt = changes.startsAt ?? existing.startsAt;
      const endsAt =
        changes.endsAt !== undefined ? changes.endsAt : existing.endsAt;

      if (endsAt && new Date(endsAt) < new Date(startsAt)) {
        throw createDateRangeError();
      }
    }

    return this.repository.updateEvent(eventId, changes);
  }

  async deleteEvent(eventId) {
    return this.repository.deleteEvent(eventId);
  }
}

// The stored event is only needed when the body supplies one side of the range
// and the other side must come from the database:
// - startsAt and endsAt together are already range-checked by the schema;
// - endsAt: null clears the end date, so there is no range to check.
function needsStoredDateRange(changes) {
  const hasStartsAt = changes.startsAt !== undefined;
  const hasEndsAt = changes.endsAt !== undefined;

  if (hasStartsAt && hasEndsAt) {
    return false;
  }

  if (hasStartsAt) {
    return true;
  }

  return hasEndsAt && changes.endsAt !== null;
}

// Shaped like the schema's range error so clients see the same 400 response
// whether the bad range comes from the body alone or from the stored event.
function createDateRangeError() {
  const error = new Error('endsAt cannot be before startsAt');
  error.status = 400;
  error.code = 'VALIDATION_ERROR';
  error.details = [
    { field: 'endsAt', message: 'endsAt cannot be before startsAt' }
  ];
  return error;
}

let calendarService = null;

export function getCalendarService() {
  if (!calendarService) {
    calendarService = new CalendarService();
  }

  return calendarService;
}

export default getCalendarService;

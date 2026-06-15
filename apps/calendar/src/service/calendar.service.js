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

  async deleteEvent(eventId) {
    return this.repository.deleteEvent(eventId);
  }
}

let calendarService = null;

export function getCalendarService() {
  if (!calendarService) {
    calendarService = new CalendarService();
  }

  return calendarService;
}

export default getCalendarService;

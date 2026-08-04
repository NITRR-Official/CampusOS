import {
  createCalendarEventSchema,
  queryCalendarEventsSchema
} from '../schema/calendar.schema.js';
import { getCalendarService } from '../service/calendar.service.js';

// the below code is repeating across plugins
function createHttpError(status, message, code, details) {
  const error = new Error(message);
  error.status = status;

  if (code) {
    error.code = code;
  }

  if (details) {
    error.details = details;
  }

  return error;
}

export function createCalendarController({ eventBus } = {}) {
  const calendarService = getCalendarService();

  /**
   * Emit a calendar lifecycle event on the core event bus, if one is wired.
   * Per ADR-008, only non-sensitive identifiers/metadata are emitted (no PII).
   */
  function emitEvent(name, payload) {
    if (eventBus && typeof eventBus.emit === 'function') {
      eventBus.emit(name, payload);
    }
  }

  async function create(req, res, next) {
    try {
      const value = createCalendarEventSchema.parse(req.body);

      const event = await calendarService.createEvent({
        ...value,
        createdBy: req.user?.id || 'unknown'
      });

      res.status(201).json({
        success: true,
        data: event
      });

      emitEvent('calendar:created', {
        eventId: event.id,
        eventType: event.eventType
      });
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: await calendarService.listEvents()
      });
    } catch (err) {
      next(err);
    }
  }

  async function queryByRange(req, res, next) {
    try {
      const value = queryCalendarEventsSchema.parse(req.query);

      const events = await calendarService.getEventsBetween(
        value.startDate,
        value.endDate
      );

      res.status(200).json({
        success: true,
        data: events
      });
    } catch (err) {
      next(err);
    }
  }

  async function getById(req, res, next) {
    const { eventId } = req.params;

    try {
      const event = await calendarService.getEvent(eventId);

      if (!event) {
        next(
          createHttpError(
            404,
            'Calendar event not found',
            'CALENDAR_EVENT_NOT_FOUND'
          )
        );
        return;
      }

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (err) {
      next(err);
    }
  }

  async function deleteEvent(req, res, next) {
    const { eventId } = req.params;

    try {
      const removed = await calendarService.deleteEvent(eventId);

      if (!removed) {
        next(
          createHttpError(
            404,
            'Calendar event not found',
            'CALENDAR_EVENT_NOT_FOUND'
          )
        );
        return;
      }

      res.status(200).json({
        success: true,
        data: { deleted: true, eventId }
      });

      emitEvent('calendar:deleted', { eventId });
    } catch (err) {
      next(err);
    }
  }

  return {
    create,
    list,
    queryByRange,
    getById,
    deleteEvent
  };
}

export default createCalendarController;

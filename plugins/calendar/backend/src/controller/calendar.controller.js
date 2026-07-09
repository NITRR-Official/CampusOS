import {
  validateCreateCalendarEventPayload,
  validateQueryCalendarEventsPayload
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

export function createCalendarController() {
  const calendarService = getCalendarService();

  function create(req, res, next) {
    const { errors, value } = validateCreateCalendarEventPayload(req.body);

    if (errors.length > 0) {
      next(
        createHttpError(
          400,
          'Request validation failed',
          'VALIDATION_ERROR',
          errors
        )
      );
      return;
    }

    const event = calendarService.createEvent({
      ...value,
      createdBy: req.user?.id || 'unknown'
    });

    res.status(201).json({
      success: true,
      data: event
    });
  }

  function list(req, res) {
    res.status(200).json({
      success: true,
      data: calendarService.listEvents()
    });
  }

  function queryByRange(req, res, next) {
    const { errors, value } = validateQueryCalendarEventsPayload(req.query);

    if (errors.length > 0) {
      next(
        createHttpError(
          400,
          'Request validation failed',
          'VALIDATION_ERROR',
          errors
        )
      );
      return;
    }

    const events = calendarService.getEventsBetween(
      value.startDate,
      value.endDate
    );

    res.status(200).json({
      success: true,
      data: events
    });
  }

  function getById(req, res, next) {
    const { eventId } = req.params;
    const event = calendarService.getEvent(eventId);

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
  }

  function deleteEvent(req, res, next) {
    const { eventId } = req.params;
    const removed = calendarService.deleteEvent(eventId);

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

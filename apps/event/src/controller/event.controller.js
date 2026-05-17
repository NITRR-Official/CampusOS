import {
  validateCreateEventPayload,
  validateRegistrationPayload,
  validateStatus,
  validateUpdateEventPayload
} from '../schema/event.schema.js';
import { getEventService } from '../service/event.service.js';

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

export function createEventController() {
  const eventService = getEventService();

  function create(req, res, next) {
    const { errors, value } = validateCreateEventPayload(req.body);

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

    const event = eventService.createEvent({
      ...value,
      createdBy: req.user?.id || 'unknown'
    });

    res.status(201).json({
      success: true,
      data: event
    });
  }

  function update(req, res, next) {
    const { eventId } = req.params;
    const { errors, value } = validateUpdateEventPayload(req.body);

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

    const event = eventService.updateEvent(eventId, value);

    if (!event) {
      next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    res.status(200).json({
      success: true,
      data: event
    });
  }

  function publish(req, res, next) {
    const { eventId } = req.params;
    const event = eventService.setStatus(eventId, 'published');

    if (!event) {
      next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    if (!validateStatus(event.status)) {
      next(
        createHttpError(500, 'Invalid event status', 'INVALID_EVENT_STATUS')
      );
      return;
    }

    res.status(200).json({
      success: true,
      data: event
    });
  }

  function unpublish(req, res, next) {
    const { eventId } = req.params;
    const event = eventService.setStatus(eventId, 'draft');

    if (!event) {
      next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    res.status(200).json({
      success: true,
      data: event
    });
  }

  function list(req, res) {
    res.status(200).json({
      success: true,
      data: eventService.listEvents()
    });
  }

  function getById(req, res, next) {
    const { eventId } = req.params;
    const event = eventService.getEvent(eventId);

    if (!event) {
      next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    res.status(200).json({
      success: true,
      data: event
    });
  }

  function register(req, res, next) {
    const { eventId } = req.params;
    const { errors, value } = validateRegistrationPayload(req.body);

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

    const registrationResult = eventService.registerForEvent(eventId, value);

    if (registrationResult.type === 'EVENT_NOT_FOUND') {
      next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    if (registrationResult.type === 'EVENT_CAPACITY_REACHED') {
      next(
        createHttpError(409, 'Event capacity reached', 'EVENT_CAPACITY_REACHED')
      );
      return;
    }

    if (registrationResult.type === 'ALREADY_REGISTERED') {
      next(
        createHttpError(
          409,
          'Already registered for this event',
          'ALREADY_REGISTERED'
        )
      );
      return;
    }

    res.status(201).json({
      success: true,
      data: registrationResult
    });
  }

  function listRegistrations(req, res, next) {
    const { eventId } = req.params;
    const event = eventService.getEvent(eventId);

    if (!event) {
      next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        eventId,
        totalRegistrations: event.registrations.length,
        registrations: event.registrations
      }
    });
  }

  return {
    create,
    update,
    publish,
    unpublish,
    list,
    getById,
    register,
    listRegistrations
  };
}

export default createEventController;

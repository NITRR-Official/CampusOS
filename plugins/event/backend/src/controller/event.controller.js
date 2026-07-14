import {
  createEventSchema,
  registrationSchema,
  validateStatus,
  updateEventSchema
} from '../schema/event.schema.js';

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

export function createEventController(eventService) {
  async function create(req, res, next) {
    try {
      const value = createEventSchema.parse(req.body);
      const event = await eventService.createEvent({
        ...value,
        createdBy: req.user?.id || 'unknown'
      });

      res.status(201).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async function update(req, res, next) {
    const { eventId } = req.params;

    try {
      const value = updateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(eventId, value);

      if (!event) {
        next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async function publish(req, res, next) {
    const { eventId } = req.params;
    try {
      const event = await eventService.setStatus(eventId, 'published');

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
    } catch (error) {
      next(error);
    }
  }

  async function unpublish(req, res, next) {
    const { eventId } = req.params;
    try {
      const event = await eventService.setStatus(eventId, 'draft');

      if (!event) {
        next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async function list(req, res, next) {
    try {
      const { clubId } = req.query;
      if (!clubId) {
        return next(
          createHttpError(
            400,
            'clubId is required for listing events',
            'VALIDATION_ERROR'
          )
        );
      }
      const events = await eventService.listEvents(clubId);
      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  async function getById(req, res, next) {
    const { eventId } = req.params;
    try {
      const event = await eventService.getEvent(eventId);

      if (!event) {
        next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async function register(req, res, next) {
    const { eventId } = req.params;

    try {
      const value = registrationSchema.parse(req.body);
      const registrationResult = await eventService.registerForEvent(
        eventId,
        value
      );

      if (registrationResult.type === 'EVENT_NOT_FOUND') {
        next(createHttpError(404, 'Event not found', 'EVENT_NOT_FOUND'));
        return;
      }

      if (registrationResult.type === 'EVENT_CAPACITY_REACHED') {
        next(
          createHttpError(
            409,
            'Event capacity reached',
            'EVENT_CAPACITY_REACHED'
          )
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
    } catch (error) {
      next(error);
    }
  }

  async function listRegistrations(req, res, next) {
    const { eventId } = req.params;
    try {
      const event = await eventService.getEvent(eventId);

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
    } catch (error) {
      next(error);
    }
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

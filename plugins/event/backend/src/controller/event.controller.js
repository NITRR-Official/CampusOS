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
      let resolvedClubId = clubId;
      if (!clubId.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const { Club } =
            await import('../../../../club/backend/src/schema/club.model.js');
          const clubDoc = await Club.findOne({ slug: clubId }).lean();
          if (clubDoc) resolvedClubId = clubDoc._id.toString();
        } catch (err) {
          console.error('Could not resolve club slug in listEvents:', err);
        }
      }

      const events = await eventService.listEvents(resolvedClubId);
      res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  async function listPublic(req, res, next) {
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
      let resolvedClubId = clubId;
      if (!clubId.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const { Club } =
            await import('../../../../club/backend/src/schema/club.model.js');
          const clubDoc = await Club.findOne({ slug: clubId }).lean();
          if (clubDoc) resolvedClubId = clubDoc._id.toString();
        } catch (err) {
          console.error('Could not resolve club slug in listEvents:', err);
        }
      }

      const events = await eventService.listEvents(resolvedClubId);

      // Filter for published events and remove sensitive data
      const publicEvents = events
        .filter((event) => event.status === 'published')
        .map((event) => ({
          _id: event._id || event.id,
          id: event.id || event._id,
          title: event.title,
          description: event.description,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          venue: event.venue,
          status: event.status,
          clubId: event.clubId
        }));

      res.status(200).json({
        success: true,
        data: publicEvents
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

  async function getPublicById(req, res, next) {
    const { eventId } = req.params;
    try {
      const event = await eventService.getEvent(eventId);

      if (!event || event.status !== 'published') {
        next(
          createHttpError(
            404,
            'Event not found or not published',
            'EVENT_NOT_FOUND'
          )
        );
        return;
      }

      const publicEvent = {
        _id: event._id || event.id,
        id: event.id || event._id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue,
        status: event.status,
        clubId: event.clubId,
        capacity: event.capacity,
        registrationsCount: event.registrations?.length || 0
      };

      res.status(200).json({
        success: true,
        data: publicEvent
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
    listPublic,
    getById,
    getPublicById,
    register,
    listRegistrations
  };
}

export default createEventController;

import { AppError } from '@campus-os/shared/errors';
import {
  createEventSchema,
  registrationSchema,
  updateEventSchema
} from '../schema/event.schema.js';

export function createEventController(eventService, registry) {
  async function resolveClubId(clubId) {
    let resolvedClubId = clubId;
    if (clubId && !clubId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        const clubService = registry.getService('club');
        const clubDoc = await clubService.getClubBySlug(clubId);
        if (clubDoc) {
          resolvedClubId = String(clubDoc.id || clubDoc._id);
        }
      } catch (err) {
        console.error('Could not resolve club slug in listEvents:', err);
      }
    }
    return resolvedClubId;
  }

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
        next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
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
        next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
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
        next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
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
      const { clubId, myEvents } = req.query;
      const resolvedClubId = await resolveClubId(clubId);

      const options = {};
      if (myEvents === 'true' && req.user?.email) {
        options.participantEmail = req.user.email;
      }

      const events = await eventService.listEvents(resolvedClubId, options);
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
      const resolvedClubId = await resolveClubId(clubId);

      const publicEvents = await eventService.listPublicEvents(resolvedClubId);

      res.status(200).json({
        success: true,
        data: publicEvents
      });
    } catch (error) {
      next(error);
    }
  }

  async function adminList(req, res, next) {
    try {
      // List all events regardless of club
      const events = await eventService.listEvents();
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
        next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
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
      const publicEvent = await eventService.getPublicEventById(eventId);

      if (!publicEvent) {
        next(
          new AppError(
            'Event not found or not published',
            404,
            'EVENT_NOT_FOUND'
          )
        );
        return;
      }

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

      if (req.user && req.user.id) {
        value.userId = req.user.id;
      }

      const registrationResult = await eventService.registerForEvent(
        eventId,
        value
      );

      if (registrationResult.type === 'EVENT_NOT_FOUND') {
        next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
        return;
      }

      if (registrationResult.type === 'EVENT_CAPACITY_REACHED') {
        next(
          new AppError('Event capacity reached', 409, 'EVENT_CAPACITY_REACHED')
        );
        return;
      }

      if (registrationResult.type === 'ALREADY_REGISTERED') {
        next(
          new AppError(
            'Already registered for this event',
            409,
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
        next(new AppError('Event not found', 404, 'EVENT_NOT_FOUND'));
        return;
      }

      const registrations = await eventService.getEventRegistrations(eventId);

      res.status(200).json({
        success: true,
        data: {
          eventId,
          totalRegistrations: registrations.length,
          registrations
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
    adminList,
    getById,
    getPublicById,
    register,
    listRegistrations
  };
}

export default createEventController;

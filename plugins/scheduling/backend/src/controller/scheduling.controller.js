import {
  createTimeSlotSchema,
  updateTimeSlotSchema,
  resolveConflictSchema
} from '../schema/scheduling.schema.js';

/**
 * Scheduling Controller Factory
 * HTTP request handlers for scheduling operations
 */

export function createSchedulingController(schedulingService) {
  return {
    /**
     * POST /api/v1/events/:eventId/schedule
     * Create a new time slot (admin/coordinator only)
     */
    async createTimeSlot(req, res, next) {
      try {
        const { eventId } = req.params;
        const value = createTimeSlotSchema.parse(req.body);

        if (!eventId) {
          return res.status(400).json({ error: 'eventId is required' });
        }

        const slot = await schedulingService.createTimeSlot({
          eventId,
          ...value
        });

        return res.status(201).json(slot);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/events/:eventId/schedule
     * Get all time slots for an event
     */
    async getEventSchedule(req, res, next) {
      try {
        const { eventId } = req.params;

        if (!eventId) {
          return res.status(400).json({ error: 'eventId is required' });
        }

        const slots = await schedulingService.getEventTimeSlots(eventId);

        return res.status(200).json({
          eventId,
          count: slots.length,
          slots
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/schedule/:slotId
     * Get time slot details
     */
    async getTimeSlot(req, res, next) {
      try {
        const { slotId } = req.params;

        if (!slotId) {
          return res.status(400).json({ error: 'slotId is required' });
        }

        const slot = await schedulingService.getTimeSlotById(slotId);

        if (!slot) {
          return res.status(404).json({ error: 'Time slot not found' });
        }

        return res.status(200).json(slot);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * PUT /api/v1/schedule/:slotId
     * Update time slot (admin/coordinator only)
     */
    async updateTimeSlot(req, res, next) {
      try {
        const { slotId } = req.params;
        const updateData = updateTimeSlotSchema.parse(req.body);

        if (!slotId) {
          return res.status(400).json({ error: 'slotId is required' });
        }

        const slot = await schedulingService.updateTimeSlot(slotId, updateData);
        return res.status(200).json(slot);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * DELETE /api/v1/schedule/:slotId
     * Delete time slot (admin/coordinator only)
     */
    async deleteTimeSlot(req, res, next) {
      try {
        const { slotId } = req.params;

        if (!slotId) {
          return res.status(400).json({ error: 'slotId is required' });
        }

        const result = await schedulingService.deleteTimeSlot(slotId);
        return res.status(200).json(result);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/schedule/conflicts
     * Get all conflicts with optional filters
     */
    async getAllConflicts(req, res, next) {
      try {
        const { resolved, severity } = req.query;
        const filters = {};

        if (resolved !== undefined) {
          filters.resolved = resolved === 'true';
        }
        if (severity) {
          filters.severity = severity;
        }

        const conflicts = await schedulingService.getAllConflicts(filters);

        return res.status(200).json({
          count: conflicts.length,
          conflicts
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/schedule/:slotId/conflicts
     * Get conflicts for a specific slot
     */
    async getSlotConflicts(req, res, next) {
      try {
        const { slotId } = req.params;

        if (!slotId) {
          return res.status(400).json({ error: 'slotId is required' });
        }

        const conflicts = await schedulingService.getSlotConflicts(slotId);

        return res.status(200).json({
          slotId,
          count: conflicts.length,
          conflicts
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * PUT /api/v1/schedule/conflicts/:conflictId/resolve
     * Mark conflict as resolved (admin/coordinator only)
     */
    async resolveConflict(req, res, next) {
      try {
        const { conflictId } = req.params;
        const { resolution } = resolveConflictSchema.parse(req.body);

        const conflict = await schedulingService.resolveConflict(
          conflictId,
          resolution
        );

        return res.status(200).json(conflict);
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/schedule/venue/:venue/available
     * Check venue availability
     */
    async checkVenueAvailability(req, res, next) {
      try {
        const { venue } = req.params;
        const { startTime, endTime } = req.query;

        if (!venue || !startTime || !endTime) {
          return res
            .status(400)
            .json({ error: 'venue, startTime, and endTime are required' });
        }

        const available = await schedulingService.isVenueAvailable(
          venue,
          startTime,
          endTime
        );

        return res.status(200).json({
          venue,
          startTime,
          endTime,
          available
        });
      } catch (error) {
        return next(error);
      }
    },

    /**
     * GET /api/v1/events/:eventId/schedule/overview
     * Get schedule overview with stats
     */
    async getScheduleOverview(req, res, next) {
      try {
        const { eventId } = req.params;

        if (!eventId) {
          return res.status(400).json({ error: 'eventId is required' });
        }

        const overview = await schedulingService.getScheduleOverview(eventId);
        return res.status(200).json(overview);
      } catch (error) {
        return next(error);
      }
    }
  };
}

export default createSchedulingController;

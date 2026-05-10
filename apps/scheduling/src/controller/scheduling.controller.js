import SchedulingService from '../service/scheduling.service.js';

const schedulingService = new SchedulingService();

/**
 * Scheduling Controller
 * HTTP request handlers for scheduling operations
 */

export const schedulingController = {
  /**
   * POST /api/v1/events/:eventId/schedule
   * Create a new time slot (admin/coordinator only)
   */
  async createTimeSlot(req, res, next) {
    try {
      const { eventId } = req.params;
      const { venue, startTime, endTime, capacity, allocatedResources, notes } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      const result = await schedulingService.createTimeSlot({
        eventId,
        venue,
        startTime,
        endTime,
        capacity,
        allocatedResources,
        notes
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.slot);
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
      const updateData = req.body;

      if (!slotId) {
        return res.status(400).json({ error: 'slotId is required' });
      }

      const result = await schedulingService.updateTimeSlot(slotId, updateData);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result.slot);
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

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

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
      const { resolution } = req.body;

      if (!conflictId) {
        return res.status(400).json({ error: 'conflictId is required' });
      }

      if (!resolution) {
        return res.status(400).json({ error: 'resolution is required' });
      }

      const result = await schedulingService.resolveConflict(conflictId, resolution);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      return res.status(200).json(result.conflict);
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
        return res.status(400).json({ error: 'venue, startTime, and endTime are required' });
      }

      const available = await schedulingService.isVenueAvailable(venue, startTime, endTime);

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

export default schedulingController;

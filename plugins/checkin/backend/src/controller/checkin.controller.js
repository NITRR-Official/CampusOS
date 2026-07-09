import CheckInService from '../service/checkin.service.js';

const checkInService = new CheckInService();

/**
 * Check-in Controller
 * HTTP request handlers for check-in operations
 */

export const checkInController = {
  /**
   * GET /api/v1/events/:eventId/checkins
   * Get all check-ins for an event (admin/coordinator only)
   */
  async listCheckIns(req, res, next) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    try {
      const checkIns = checkInService.getCheckInsByEventId(eventId);
      return res.status(200).json({
        eventId,
        count: checkIns.length,
        checkIns
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/events/:eventId/checkins
   * Create a check-in record for an attendee (admin/coordinator only)
   */
  async createCheckIn(req, res, next) {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ error: 'eventId and userId are required' });
    }

    try {
      const result = checkInService.createCheckIn(eventId, userId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.checkIn);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/events/:eventId/checkins/status/:userId
   * Get check-in status for a user at an event (self/admin/coordinator)
   */
  async getCheckInStatus(req, res, next) {
    const { eventId, userId } = req.params;

    if (!eventId || !userId) {
      return res.status(400).json({ error: 'eventId and userId are required' });
    }

    try {
      const checkIn = checkInService.getUserCheckInStatus(eventId, userId);
      if (!checkIn) {
        return res.status(404).json({ error: 'No check-in record found' });
      }

      return res.status(200).json(checkIn);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/checkins/scan
   * Mark user as checked-in by scanning QR code (public/self)
   */
  async scanQRCode(req, res, next) {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'qrCode is required' });
    }

    try {
      const result = checkInService.markAsCheckedInByQRCode(qrCode);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Successfully checked in',
        checkIn: result.checkIn
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/events/:eventId/attendance-stats
   * Get attendance statistics for an event (admin/coordinator only)
   */
  async getAttendanceStats(req, res, next) {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    try {
      const stats = checkInService.getAttendanceStats(eventId);
      return res.status(200).json(stats);
    } catch (error) {
      return next(error);
    }
  }
};

export default checkInController;

import crypto from 'node:crypto';

/**
 * Check-in Service
 * Manages event attendance and QR code generation
 */
export function createCheckInService(checkInRepository) {
  /**
   * Create a check-in record for an attendee
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {object} Created check-in record
   */
  async function createCheckIn(eventId, userId) {
    if (!eventId || !userId) {
      return { success: false, error: 'eventId and userId are required' };
    }

    const qrCode = crypto.randomBytes(16).toString('hex');
    const now = new Date();

    const checkIn = {
      eventId,
      userId,
      qrCode,
      status: 'pending',
      checkedInAt: null,
      createdAt: now,
      updatedAt: now
    };

    const savedCheckIn = await checkInRepository.saveCheckIn(checkIn);
    return { success: true, checkIn: savedCheckIn };
  }

  /**
   * Get check-in by ID
   * @param {string} checkInId - Check-in ID
   * @returns {object|null} Check-in record
   */
  async function getCheckInById(checkInId) {
    return checkInRepository.getCheckInById(checkInId);
  }

  /**
   * Get check-in by QR code
   * @param {string} qrCode - QR code string
   * @returns {object|null} Check-in record
   */
  async function getCheckInByQRCode(qrCode) {
    return checkInRepository.getCheckInByQRCode(qrCode);
  }

  /**
   * Get all check-ins for an event
   * @param {string} eventId - Event ID
   * @returns {array} Check-in records for event
   */
  async function getCheckInsByEventId(eventId) {
    return checkInRepository.getCheckInsByEventId(eventId);
  }

  /**
   * Get check-in status for user at event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {object|null} Check-in record or null if not found
   */
  async function getUserCheckInStatus(eventId, userId) {
    return checkInRepository.getUserCheckInStatus(eventId, userId);
  }

  /**
   * Mark user as checked-in by QR code
   * @param {string} qrCode - QR code string
   * @returns {object} Result with success status and check-in or error
   */
  async function markAsCheckedInByQRCode(qrCode) {
    const checkIn = await checkInRepository.getCheckInByQRCode(qrCode);
    if (!checkIn) {
      return { success: false, error: 'Invalid QR code' };
    }

    if (checkIn.status === 'checked-in') {
      return { success: false, error: 'Already checked in' };
    }

    checkIn.status = 'checked-in';
    checkIn.checkedInAt = new Date();
    checkIn.updatedAt = new Date();

    const updatedCheckIn = await checkInRepository.saveCheckIn(checkIn);
    return { success: true, checkIn: updatedCheckIn };
  }

  /**
   * Get attendance statistics for an event
   * @param {string} eventId - Event ID
   * @returns {object} Attendance stats
   */
  async function getAttendanceStats(eventId) {
    const checkIns = await checkInRepository.getCheckInsByEventId(eventId);
    const totalRegistered = checkIns.length;
    const checkedIn = checkIns.filter((c) => c.status === 'checked-in').length;
    const pending = totalRegistered - checkedIn;

    return {
      eventId,
      totalRegistered,
      checkedIn,
      pending,
      checkInRate:
        totalRegistered > 0
          ? ((checkedIn / totalRegistered) * 100).toFixed(2)
          : 0
    };
  }

  /**
   * List all check-ins (admin only)
   * @returns {array} All check-in records
   */
  async function listAllCheckIns() {
    return checkInRepository.listAllCheckIns();
  }

  /**
   * Delete all check-ins for an event
   * @param {string} eventId - Event ID
   */
  async function deleteEventCheckIns(eventId) {
    return checkInRepository.deleteEventCheckIns(eventId);
  }

  return {
    createCheckIn,
    getCheckInById,
    getCheckInByQRCode,
    getCheckInsByEventId,
    getUserCheckInStatus,
    markAsCheckedInByQRCode,
    getAttendanceStats,
    listAllCheckIns,
    deleteEventCheckIns
  };
}

export default createCheckInService;

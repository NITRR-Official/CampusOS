import crypto from 'crypto';

/**
 * Check-in Service
 * Manages event attendance and QR code generation
 */

export class CheckInService {
  #storage = new Map();
  #qrCodeIndex = new Map();

  /**
   * Create a check-in record for an attendee
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {object} Created check-in record
   */
  createCheckIn(eventId, userId) {
    if (!eventId || !userId) {
      return { success: false, error: 'eventId and userId are required' };
    }

    const id = crypto.randomUUID();
    const qrCode = crypto.randomBytes(16).toString('hex');
    const now = new Date();

    const checkIn = {
      id,
      eventId,
      userId,
      qrCode,
      status: 'pending',
      checkedInAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.#storage.set(id, checkIn);
    this.#qrCodeIndex.set(qrCode, id);

    return { success: true, checkIn };
  }

  /**
   * Get check-in by ID
   * @param {string} checkInId - Check-in ID
   * @returns {object|null} Check-in record
   */
  getCheckInById(checkInId) {
    return this.#storage.get(checkInId) || null;
  }

  /**
   * Get check-in by QR code
   * @param {string} qrCode - QR code string
   * @returns {object|null} Check-in record
   */
  getCheckInByQRCode(qrCode) {
    const checkInId = this.#qrCodeIndex.get(qrCode);
    return checkInId ? this.#storage.get(checkInId) : null;
  }

  /**
   * Get all check-ins for an event
   * @param {string} eventId - Event ID
   * @returns {array} Check-in records for event
   */
  getCheckInsByEventId(eventId) {
    return Array.from(this.#storage.values()).filter(
      (checkIn) => checkIn.eventId === eventId
    );
  }

  /**
   * Get check-in status for user at event
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @returns {object|null} Check-in record or null if not found
   */
  getUserCheckInStatus(eventId, userId) {
    return (
      Array.from(this.#storage.values()).find(
        (checkIn) => checkIn.eventId === eventId && checkIn.userId === userId
      ) || null
    );
  }

  /**
   * Mark user as checked-in by QR code
   * @param {string} qrCode - QR code string
   * @returns {object} Result with success status and check-in or error
   */
  markAsCheckedInByQRCode(qrCode) {
    const checkIn = this.getCheckInByQRCode(qrCode);
    if (!checkIn) {
      return { success: false, error: 'Invalid QR code' };
    }

    if (checkIn.status === 'checked-in') {
      return { success: false, error: 'Already checked in' };
    }

    checkIn.status = 'checked-in';
    checkIn.checkedInAt = new Date();
    checkIn.updatedAt = new Date();

    return { success: true, checkIn };
  }

  /**
   * Get attendance statistics for an event
   * @param {string} eventId - Event ID
   * @returns {object} Attendance stats
   */
  getAttendanceStats(eventId) {
    const checkIns = this.getCheckInsByEventId(eventId);
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
  listAllCheckIns() {
    return Array.from(this.#storage.values());
  }
}

export default CheckInService;

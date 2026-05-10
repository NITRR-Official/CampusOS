import crypto from 'crypto';
import { Conflict, TimeSlot } from '../../../../backend/src/database/schemas/scheduling.schema.js';

/**
 * Scheduling Service
 * Manages time slot bookings and detects scheduling conflicts
 */

function normalizeSlot(slotDoc) {
  if (!slotDoc) {
    return null;
  }

  const slot = slotDoc.toObject ? slotDoc.toObject() : { ...slotDoc };
  const slotId = slot.id || slot._id;

  slot.id = slotId;
  delete slot._id;

  if (slot.resourcesAllocated && !slot.allocatedResources) {
    slot.allocatedResources = slot.resourcesAllocated;
  }

  delete slot.resourcesAllocated;
  return slot;
}

function normalizeConflict(conflictDoc) {
  if (!conflictDoc) {
    return null;
  }

  const conflict = conflictDoc.toObject ? conflictDoc.toObject() : { ...conflictDoc };
  conflict.id = conflict.id || conflict._id;
  delete conflict._id;

  return conflict;
}

export class SchedulingService {
  /**
   * Create a new time slot
   * @param {object} slotData - Time slot information
   * @returns {object} Created slot record
   */
  async createTimeSlot(slotData) {
    const { eventId, venue, startTime, endTime, capacity, allocatedResources, notes } = slotData;

    if (!eventId || !venue || !startTime || !endTime || !capacity) {
      return { success: false, error: 'Missing required fields: eventId, venue, startTime, endTime, capacity' };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return { success: false, error: 'startTime must be before endTime' };
    }

    try {
      const slot = await TimeSlot.create({
        eventId,
        venue,
        startTime: start,
        endTime: end,
        capacity,
        resourcesAllocated: allocatedResources || [],
        status: 'scheduled',
        notes: notes || null
      });

      await this.detectConflictsForSlot(slot._id);

      return { success: true, slot: normalizeSlot(slot) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get time slot by ID
   * @param {string} slotId - Time slot ID
   * @returns {object|null} Slot record
   */
  async getTimeSlotById(slotId) {
    try {
      const slot = await TimeSlot.findById(slotId).lean();
      return normalizeSlot(slot);
    } catch (error) {
      console.error('Error fetching time slot:', error);
      return null;
    }
  }

  /**
   * Get all time slots for event
   * @param {string} eventId - Event ID
   * @returns {array} List of time slots
   */
  async getEventTimeSlots(eventId) {
    try {
      const slots = await TimeSlot.find({ eventId }).lean();
      return slots.map((slot) => normalizeSlot(slot));
    } catch (error) {
      console.error('Error fetching event time slots:', error);
      return [];
    }
  }

  /**
   * Update time slot
   * @param {string} slotId - Time slot ID
   * @param {object} updateData - Data to update
   * @returns {object} Updated slot
   */
  async updateTimeSlot(slotId, updateData) {
    try {
      const updates = { ...updateData, updatedAt: new Date() };
      if (updates.allocatedResources) {
        updates.resourcesAllocated = updates.allocatedResources;
        delete updates.allocatedResources;
      }

      const slot = await TimeSlot.findByIdAndUpdate(
        slotId,
        updates,
        { new: true, runValidators: true }
      );

      if (!slot) {
        return { success: false, error: 'Time slot not found' };
      }

      if (updateData.startTime || updateData.endTime || updateData.venue || updateData.allocatedResources) {
        await this.detectConflictsForSlot(slotId);
      }

      return { success: true, slot: normalizeSlot(slot) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete time slot
   * @param {string} slotId - Time slot ID
   * @returns {object} Deletion result
   */
  async deleteTimeSlot(slotId) {
    try {
      const slot = await TimeSlot.findByIdAndDelete(slotId);

      if (!slot) {
        return { success: false, error: 'Time slot not found' };
      }

      return { success: true, message: 'Time slot deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect conflicts for a time slot
   * @param {string} slotId - Time slot ID to check
   * @returns {array} Detected conflicts
   */
  async detectConflictsForSlot(slotId) {
    try {
      const slot = await TimeSlot.findById(slotId).lean();
      if (!slot) {
        return [];
      }

      const conflicts = [];
      const otherSlots = await TimeSlot.find({ _id: { $ne: slotId } }).lean();

      otherSlots.forEach((otherSlot) => {
        if (slot.venue === otherSlot.venue) {
          if (this.hasTimeOverlap(slot, otherSlot)) {
            conflicts.push({
              slotId: otherSlot._id,
              type: 'venue-overlap',
              description: `Venue "${slot.venue}" is double-booked`
            });
          }
        }

        const commonResources = this.findCommonResources(slot, otherSlot);
        if (commonResources.length > 0 && this.hasTimeOverlap(slot, otherSlot)) {
          conflicts.push({
            slotId: otherSlot._id,
            type: 'resource-overlap',
            description: `Resource(s) ${commonResources.join(', ')} are double-booked`
          });
        }
      });

      if (conflicts.length > 0) {
        const now = new Date();
        await Conflict.insertMany(
          conflicts.map((conflict) => ({
            slotId1: slotId,
            slotId2: conflict.slotId,
            conflictType: conflict.type,
            severity: 'high',
            description: conflict.description,
            resolved: false,
            resolution: null,
            createdAt: now,
            updatedAt: now
          }))
        );
      }

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }

  /**
   * Check if two slots have time overlap
   * @param {object} slot1 - First slot
   * @param {object} slot2 - Second slot
   * @returns {boolean} Whether slots overlap
   */
  hasTimeOverlap(slot1, slot2) {
    return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime;
  }

  /**
   * Find common resources between two slots
   * @param {object} slot1 - First slot
   * @param {object} slot2 - Second slot
   * @returns {array} Common resource IDs
   */
  findCommonResources(slot1, slot2) {
    const slot1Resources = slot1.resourcesAllocated || slot1.allocatedResources || [];
    const slot2Resources = slot2.resourcesAllocated || slot2.allocatedResources || [];

    const res1Ids = new Set(slot1Resources.map((resource) => resource.resourceId));
    const res2Ids = slot2Resources.map((resource) => resource.resourceId);

    return res2Ids.filter((id) => res1Ids.has(id));
  }

  /**
   * Get all conflicts
   * @param {object} filters - Filter options
   * @returns {array} List of conflicts
   */
  async getAllConflicts(filters = {}) {
    try {
      const query = {};

      if (filters.resolved !== undefined) {
        query.resolved = filters.resolved;
      }

      if (filters.severity) {
        query.severity = filters.severity;
      }

      const conflicts = await Conflict.find(query).lean();
      return conflicts.map((conflict) => normalizeConflict(conflict));
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      return [];
    }
  }

  /**
   * Get conflicts for a specific slot
   * @param {string} slotId - Time slot ID
   * @returns {array} Conflicts involving this slot
   */
  async getSlotConflicts(slotId) {
    try {
      const conflicts = await Conflict.find({
        $or: [{ slotId1: slotId }, { slotId2: slotId }]
      }).lean();

      return conflicts.map((conflict) => normalizeConflict(conflict));
    } catch (error) {
      console.error('Error fetching slot conflicts:', error);
      return [];
    }
  }

  /**
   * Mark conflict as resolved
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution description
   * @returns {object} Updated conflict
   */
  async resolveConflict(conflictId, resolution) {
    try {
      const conflict = await Conflict.findById(conflictId);

      if (!conflict) {
        return { success: false, error: 'Conflict not found' };
      }

      conflict.resolved = true;
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date();
      conflict.updatedAt = new Date();

      await conflict.save();

      return { success: true, conflict: normalizeConflict(conflict) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check venue availability
   * @param {string} venue - Venue name
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {boolean} Whether venue is available
   */
  async isVenueAvailable(venue, startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const overlap = await TimeSlot.exists({
      venue,
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    return !overlap;
  }

  /**
   * Get schedule overview for event
   * @param {string} eventId - Event ID
   * @returns {object} Schedule overview with stats
   */
  async getScheduleOverview(eventId) {
    const slots = await TimeSlot.find({ eventId }).lean();
    const slotIds = slots.map((slot) => slot._id);

    const conflicts = await Conflict.find({
      $or: [{ slotId1: { $in: slotIds } }, { slotId2: { $in: slotIds } }]
    }).lean();

    const normalizedSlots = slots.map((slot) => normalizeSlot(slot));
    const normalizedConflicts = conflicts.map((conflict) => normalizeConflict(conflict));

    return {
      eventId,
      totalSlots: normalizedSlots.length,
      totalConflicts: normalizedConflicts.length,
      resolvedConflicts: normalizedConflicts.filter((conflict) => conflict.resolved).length,
      unresolvedConflicts: normalizedConflicts.filter((conflict) => !conflict.resolved).length,
      slots: normalizedSlots,
      conflicts: normalizedConflicts
    };
  }
}

export default SchedulingService;

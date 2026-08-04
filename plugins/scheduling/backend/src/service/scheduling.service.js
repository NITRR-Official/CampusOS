import { TimeSlot, Conflict } from '../schema/scheduling.model.js';
import { AppError } from '@campus-os/shared/errors';

/**
 * Scheduling Service Factory
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

  const conflict = conflictDoc.toObject
    ? conflictDoc.toObject()
    : { ...conflictDoc };
  conflict.id = conflict.id || conflict._id;
  delete conflict._id;

  return conflict;
}

export function createSchedulingService() {
  const service = {
    /**
     * Create a new time slot
     */
    async createTimeSlot(slotData) {
      const {
        eventId,
        venue,
        startTime,
        endTime,
        capacity,
        allocatedResources,
        notes
      } = slotData;

      if (!eventId || !venue || !startTime || !endTime || !capacity) {
        throw new AppError(
          'Missing required fields: eventId, venue, startTime, endTime, capacity',
          400,
          'VALIDATION_ERROR'
        );
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        throw new AppError(
          'startTime must be before endTime',
          400,
          'VALIDATION_ERROR'
        );
      }

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

      await service.detectConflictsForSlot(slot._id);

      return normalizeSlot(slot);
    },

    /**
     * Get time slot by ID
     */
    async getTimeSlotById(slotId) {
      const slot = await TimeSlot.findById(slotId).lean();
      return normalizeSlot(slot);
    },

    /**
     * Get all time slots for event
     */
    async getEventTimeSlots(eventId) {
      const slots = await TimeSlot.find({ eventId }).lean();
      return slots.map((slot) => normalizeSlot(slot));
    },

    /**
     * Update time slot
     */
    async updateTimeSlot(slotId, updateData) {
      const updates = { ...updateData, updatedAt: new Date() };
      if (updates.allocatedResources) {
        updates.resourcesAllocated = updates.allocatedResources;
        delete updates.allocatedResources;
      }

      const slot = await TimeSlot.findByIdAndUpdate(slotId, updates, {
        returnDocument: 'after',
        runValidators: true
      });

      if (!slot) {
        throw new AppError('Time slot not found', 404, 'NOT_FOUND');
      }

      if (
        updateData.startTime ||
        updateData.endTime ||
        updateData.venue ||
        updateData.allocatedResources
      ) {
        await service.detectConflictsForSlot(slotId);
      }

      return normalizeSlot(slot);
    },

    /**
     * Delete time slot
     */
    async deleteTimeSlot(slotId) {
      const slot = await TimeSlot.findByIdAndDelete(slotId);

      if (!slot) {
        throw new AppError('Time slot not found', 404, 'NOT_FOUND');
      }

      return { success: true, message: 'Time slot deleted successfully' };
    },

    /**
     * Delete schedule for event
     */
    async deleteEventSchedule(eventId) {
      const slots = await TimeSlot.find({ eventId }).lean();
      const slotIds = slots.map((slot) => slot._id);

      await Conflict.deleteMany({
        $or: [{ slotId1: { $in: slotIds } }, { slotId2: { $in: slotIds } }]
      });

      await TimeSlot.deleteMany({ eventId });

      return { success: true };
    },

    /**
     * Detect conflicts for a time slot
     */
    async detectConflictsForSlot(slotId) {
      const slot = await TimeSlot.findById(slotId).lean();
      if (!slot) {
        return [];
      }

      const conflicts = [];
      const otherSlots = await TimeSlot.find({
        _id: { $ne: slotId },
        startTime: { $lt: slot.endTime },
        endTime: { $gt: slot.startTime }
      }).lean();

      otherSlots.forEach((otherSlot) => {
        if (slot.venue === otherSlot.venue) {
          if (service.hasTimeOverlap(slot, otherSlot)) {
            conflicts.push({
              slotId: otherSlot._id,
              type: 'venue-overlap',
              description: `Venue "${slot.venue}" is double-booked`
            });
          }
        }

        const commonResources = service.findCommonResources(slot, otherSlot);
        if (
          commonResources.length > 0 &&
          service.hasTimeOverlap(slot, otherSlot)
        ) {
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
    },

    /**
     * Check if two slots have time overlap
     */
    hasTimeOverlap(slot1, slot2) {
      return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime;
    },

    /**
     * Find common resources between two slots
     */
    findCommonResources(slot1, slot2) {
      const slot1Resources =
        slot1.resourcesAllocated || slot1.allocatedResources || [];
      const slot2Resources =
        slot2.resourcesAllocated || slot2.allocatedResources || [];

      const res1Ids = new Set(
        slot1Resources.map((resource) => resource.resourceId)
      );
      const res2Ids = slot2Resources.map((resource) => resource.resourceId);

      return res2Ids.filter((id) => res1Ids.has(id));
    },

    /**
     * Get all conflicts
     */
    async getAllConflicts(filters = {}) {
      const query = {};

      if (filters.resolved !== undefined) {
        query.resolved = filters.resolved;
      }

      if (filters.severity) {
        query.severity = filters.severity;
      }

      const conflicts = await Conflict.find(query).lean();
      return conflicts.map((conflict) => normalizeConflict(conflict));
    },

    /**
     * Get conflicts for a specific slot
     */
    async getSlotConflicts(slotId) {
      const conflicts = await Conflict.find({
        $or: [{ slotId1: slotId }, { slotId2: slotId }]
      }).lean();

      return conflicts.map((conflict) => normalizeConflict(conflict));
    },

    /**
     * Mark conflict as resolved
     */
    async resolveConflict(conflictId, resolution) {
      const conflict = await Conflict.findById(conflictId);

      if (!conflict) {
        throw new AppError('Conflict not found', 404, 'NOT_FOUND');
      }

      conflict.resolved = true;
      conflict.resolution = resolution;
      conflict.resolvedAt = new Date();
      conflict.updatedAt = new Date();

      await conflict.save();

      return normalizeConflict(conflict);
    },

    /**
     * Check venue availability
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
    },

    /**
     * Get schedule overview for event
     */
    async getScheduleOverview(eventId) {
      const slots = await TimeSlot.find({ eventId }).lean();
      const slotIds = slots.map((slot) => slot._id);

      const conflicts = await Conflict.find({
        $or: [{ slotId1: { $in: slotIds } }, { slotId2: { $in: slotIds } }]
      }).lean();

      const normalizedSlots = slots.map((slot) => normalizeSlot(slot));
      const normalizedConflicts = conflicts.map((conflict) =>
        normalizeConflict(conflict)
      );

      return {
        eventId,
        totalSlots: normalizedSlots.length,
        totalConflicts: normalizedConflicts.length,
        resolvedConflicts: normalizedConflicts.filter(
          (conflict) => conflict.resolved
        ).length,
        unresolvedConflicts: normalizedConflicts.filter(
          (conflict) => !conflict.resolved
        ).length,
        slots: normalizedSlots,
        conflicts: normalizedConflicts
      };
    }
  };

  return service;
}

export default createSchedulingService;

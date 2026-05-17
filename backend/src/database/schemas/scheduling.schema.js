/**
 * Scheduling Schema
 * Mongoose schema for time slot and venue scheduling
 */

import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    eventId: {
      type: String,
      required: true,
      index: true
    },
    venue: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    capacity: {
      type: Number,
      min: 1
    },
    purpose: {
      type: String,
      trim: true
    },
    resourcesAllocated: [
      {
        resourceId: String,
        quantity: Number
      }
    ],
    status: {
      type: String,
      default: 'scheduled'
    },
    notes: String
  },
  {
    timestamps: true,
    collection: 'timeslots'
  }
);

const conflictSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    slotId1: {
      type: String,
      required: true
    },
    slotId2: {
      type: String,
      required: true
    },
    conflictType: {
      type: String,
      enum: [
        'venue',
        'resource',
        'time',
        'capacity',
        'venue-overlap',
        'resource-overlap',
        'time-overlap'
      ],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String,
    resolved: {
      type: Boolean,
      default: false
    },
    resolution: String,
    resolvedAt: Date,
    resolvedBy: String
  },
  {
    timestamps: true,
    collection: 'conflicts'
  }
);

// Indexes
timeSlotSchema.index({ venue: 1 });
timeSlotSchema.index({ startTime: 1, endTime: 1 });

conflictSchema.index({ slotId1: 1, slotId2: 1 });
conflictSchema.index({ resolved: 1 });

export const TimeSlot = mongoose.model('TimeSlot', timeSlotSchema);
export const Conflict = mongoose.model('Conflict', conflictSchema);

export default { TimeSlot, Conflict };

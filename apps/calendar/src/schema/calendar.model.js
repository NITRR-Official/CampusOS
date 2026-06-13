/**
 * Calendar Event Model
 * Mongoose model for calendar event persistence.
 *
 * Note: the conventional `calendar.schema.js` name is already used by the
 * request-validation module, so the Mongoose model lives in `calendar.model.js`
 * to keep validation and persistence concerns in clearly separated files.
 */

import mongoose from 'mongoose';

const EVENT_TYPES = ['task-deadline', 'event', 'milestone'];

const calendarEventSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      enum: EVENT_TYPES
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      default: null
    },
    linkedTaskId: {
      type: String,
      default: null
    },
    linkedEventId: {
      type: String,
      default: null
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'calendarevents'
  }
);

// Ascending index supports ascending-ordered listing and date-range queries.
calendarEventSchema.index({ startsAt: 1 });

export const CalendarEvent = mongoose.model(
  'CalendarEvent',
  calendarEventSchema
);

export default CalendarEvent;

import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    eventType: {
      type: String,
      enum: ['task-deadline', 'event', 'milestone'],
      required: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      default: null
    },
    linkedTaskId: {
      type: String,
      default: null
    },
    linkedEventId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'calendarevents'
  }
);

// Indexes
calendarEventSchema.index({ startsAt: 1, endsAt: 1 });
calendarEventSchema.index({ linkedTaskId: 1 });
calendarEventSchema.index({ linkedEventId: 1 });
calendarEventSchema.index({ eventType: 1 });

calendarEventSchema.set('toJSON', { virtuals: true });
calendarEventSchema.set('toObject', { virtuals: true });

export const CalendarEvent = mongoose.model(
  'CalendarEvent',
  calendarEventSchema
);

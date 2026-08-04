import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true
    },
    attendeeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    userId: {
      type: String, // Store external system user ID if available
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'event_registrations'
  }
);

// Prevent double registrations by the same email for the same event
eventRegistrationSchema.index(
  { eventId: 1, attendeeEmail: 1 },
  { unique: true }
);
eventRegistrationSchema.index({ userId: 1 });

eventRegistrationSchema.set('toJSON', { virtuals: true });
eventRegistrationSchema.set('toObject', { virtuals: true });

export const EventRegistration = mongoose.model(
  'EventRegistration',
  eventRegistrationSchema
);

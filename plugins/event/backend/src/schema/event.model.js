import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute',
      required: true
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    venue: {
      type: String,
      default: null,
      trim: true
    },
    capacity: {
      type: Number,
      default: null
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    registrationsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'events'
  }
);

// Indexes for fast querying
eventSchema.index({ instituteId: 1 });
eventSchema.index({ clubId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startsAt: 1 });

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export const Event = mongoose.model('Event', eventSchema);

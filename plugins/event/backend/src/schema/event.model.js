import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
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
    description: {
      type: String,
      trim: true
    },
    instituteId: {
      type: String,
      required: true
    },
    clubId: {
      type: String,
      required: true
    },
    createdBy: {
      type: String,
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
    registrations: {
      type: Array,
      default: []
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

export const Event = mongoose.model('Event', eventSchema);

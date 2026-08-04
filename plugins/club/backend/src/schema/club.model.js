import mongoose from 'mongoose';

const STATUS_VALUES = [
  'pending_verification',
  'pending',
  'approved',
  'rejected',
  'archived'
];

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'pending_verification'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'clubs'
  }
);

// Indexes
clubSchema.index({ createdBy: 1 });
clubSchema.index({ status: 1 });

clubSchema.set('toJSON', { virtuals: true });
clubSchema.set('toObject', { virtuals: true });

export const Club = mongoose.model('Club', clubSchema);
export default Club;

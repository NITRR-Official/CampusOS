import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    qrCode: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['pending', 'checked-in'],
      default: 'pending'
    },
    checkedInAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'checkins'
  }
);

// Indexes
checkInSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // A user can only register/check-in once per event

checkInSchema.set('toJSON', { virtuals: true });
checkInSchema.set('toObject', { virtuals: true });

export const CheckIn = mongoose.model('CheckIn', checkInSchema);

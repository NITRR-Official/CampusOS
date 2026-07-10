import mongoose from 'mongoose';

const STATUS_VALUES = ['pending_verification', 'pending', 'approved', 'rejected'];

const clubSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
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
    instituteId: {
      type: String,
      required: true,
      trim: true
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
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'clubs'
  }
);

export const Club = mongoose.model('Club', clubSchema);
export default Club;

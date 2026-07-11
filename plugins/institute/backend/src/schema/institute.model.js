import mongoose from 'mongoose';

const instituteSchema = new mongoose.Schema(
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
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true // Allows null codes if some don't have them
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    location: {
      type: String,
      default: null,
      trim: true
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'institutes'
  }
);

export const Institute = mongoose.model('Institute', instituteSchema);

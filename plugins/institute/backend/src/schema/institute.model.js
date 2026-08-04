import mongoose from 'mongoose';

const instituteSchema = new mongoose.Schema(
  {
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

instituteSchema.set('toJSON', { virtuals: true });
instituteSchema.set('toObject', { virtuals: true });

export const Institute = mongoose.model('Institute', instituteSchema);

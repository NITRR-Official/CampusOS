import mongoose from 'mongoose';

const pluginSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    enabled: {
      type: Boolean,
      default: false
    },
    version: {
      type: String,
      default: '1.0.0'
    }
  },
  {
    timestamps: true
  }
);

pluginSchema.set('toJSON', { virtuals: true });
pluginSchema.set('toObject', { virtuals: true });

export const Plugin = mongoose.model('Plugin', pluginSchema);

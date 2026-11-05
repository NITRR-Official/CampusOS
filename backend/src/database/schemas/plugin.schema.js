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
    },
    tier: {
      type: String,
      enum: ['core', 'community'],
      default: 'community'
    },
    requestedCapabilities: {
      type: [String],
      default: []
    },
    grantedCapabilities: {
      type: [String],
      default: []
    },
    trusted: {
      type: Boolean,
      default: false
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

pluginSchema.set('toJSON', { virtuals: true });
pluginSchema.set('toObject', { virtuals: true });

export const Plugin = mongoose.model('Plugin', pluginSchema);

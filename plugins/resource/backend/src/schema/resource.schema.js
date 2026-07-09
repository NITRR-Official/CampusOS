/**
 * Resource Schema
 * Mongoose schema for resource/equipment data persistence
 */

import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true,
      enum: ['equipment', 'furniture', 'technology', 'consumable', 'other'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'pieces',
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    owner: {
      type: String,
      trim: true
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    status: {
      type: String,
      default: 'available'
    },
    purchaseDate: Date,
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceDate: Date,
    maintenanceNotes: String,
    cost: {
      type: Number,
      default: 0
    },
    allocations: [
      {
        allocationId: String,
        eventId: String,
        allocatedQuantity: Number,
        startDate: Date,
        endDate: Date,
        status: {
          type: String,
          enum: ['pending', 'allocated', 'in-use', 'returned', 'damaged'],
          default: 'pending'
        },
        notes: String,
        allocatedAt: {
          type: Date,
          default: Date.now
        },
        createdAt: {
          type: Date,
          default: Date.now
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'resources'
  }
);

// Indexes
resourceSchema.index({ type: 1 });
resourceSchema.index({ 'allocations.eventId': 1 });
resourceSchema.index({ condition: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;

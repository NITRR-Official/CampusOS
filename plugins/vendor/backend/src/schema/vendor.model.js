/**
 * Vendor Schema
 * Mongoose schema for vendor data persistence
 */

import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    clubId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    nameLower: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    bankDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    serviceDescription: {
      type: String,
      trim: true
    },
    pricing: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      default: 'active'
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalEvents: {
      type: Number,
      default: 0
    },
    ratings: [
      {
        rating: {
          type: Number,
          min: 0,
          max: 5
        },
        comment: String,
        ratedBy: String,
        ratedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    assignments: [
      {
        assignmentId: {
          type: String,
          required: true
        },
        eventId: {
          type: String,
          required: true
        },
        amount: {
          type: Number,
          default: null
        },
        assignedAt: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ['assigned', 'confirmed', 'completed', 'cancelled'],
          default: 'assigned'
        },
        notes: String,
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
    collection: 'vendors'
  }
);

// Indexes for better query performance
vendorSchema.index({ clubId: 1 });
vendorSchema.index({ clubId: 1, category: 1 });
vendorSchema.index({ clubId: 1, email: 1 });
vendorSchema.index({ clubId: 1, nameLower: 1 });
vendorSchema.index({ 'assignments.eventId': 1 });
vendorSchema.index({ 'assignments.assignmentId': 1 });

vendorSchema.set('toJSON', { virtuals: true });
vendorSchema.set('toObject', { virtuals: true });

export const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;

import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    clubId: {
      type: String,
      ref: 'Club',
      default: null // null for global/template roles
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    permissions: [
      {
        type: String
      }
    ],
    hierarchyLevel: {
      type: Number,
      default: 0
    },
    isTemplate: {
      type: Boolean,
      default: false
    },
    roleType: {
      type: String,
      enum: ['role', 'team'],
      default: 'role'
    },
    color: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'roles'
  }
);

// Index for quickly fetching roles of a club
roleSchema.index({ clubId: 1 });

roleSchema.set('toJSON', { virtuals: true });
roleSchema.set('toObject', { virtuals: true });

export const Role = mongoose.model('Role', roleSchema);
export default Role;

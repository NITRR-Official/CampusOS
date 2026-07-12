import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
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

export const Role = mongoose.model('Role', roleSchema);
export default Role;

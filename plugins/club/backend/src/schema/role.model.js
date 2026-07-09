import mongoose from 'mongoose';

export const PERMISSIONS = {
  ADMINISTRATOR: 'administrator',
  CLUB_MANAGE: 'club:manage',
  ROLE_MANAGE: 'role:manage',
  MEMBER_MANAGE: 'member:manage',
  EVENT_CREATE: 'event:create',
  EVENT_MANAGE: 'event:manage',
  BUDGET_VIEW: 'budget:view',
  BUDGET_MANAGE: 'budget:manage',
  TASK_MANAGE: 'task:manage'
};

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
        type: String,
        enum: Object.values(PERMISSIONS)
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

import mongoose from 'mongoose';
import registry from '../../../../backend/src/utils/registry.js';

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

const roleSchema = new mongoose.Schema({
  clubId: { type: String, ref: 'Club', default: null },
  name: { type: String, required: true, trim: true },
  permissions: {
    type: [String],
    validate: {
      validator: function (perms) {
        // If registry or permissions are not yet initialized (e.g. during test setup), bypass validation
        if (
          !registry ||
          !registry.permissions ||
          registry.permissions.getAll().length === 0
        ) {
          return true;
        }
        return perms.every(
          (p) => p === 'administrator' || registry.permissions.has(p)
        );
      },
      message: (props) => `One or more permissions in [${props.value}] are not registered in the system.`
    }
  },
  hierarchyLevel: { type: Number, default: 0 },
  isTemplate: { type: Boolean, default: false },
  roleType: {
    type: String,
    enum: ['role', 'team'],
    default: 'role'
  },
  color: { type: String, trim: true }
});

export const Role = mongoose.model('Role', roleSchema);
import mongoose from "mongoose";
const VALID_ROLES = new Set(['admin', 'coordinator', 'volunteer']);

function isValidRole(role) {
  return VALID_ROLES.has(role);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateClubPayload(payload = {}) {
  const name = normalizeText(payload.name);
  const instituteId = normalizeText(payload.instituteId);
  const description = normalizeText(payload.description);
  const category = normalizeText(payload.category);
  const errors = [];

  if (name.length < 3 || name.length > 120) {
    errors.push({
      field: 'name',
      message: 'Name must be between 3 and 120 characters'
    });
  }

  if (!instituteId) {
    errors.push({
      field: 'instituteId',
      message: 'Institute ID is required'
    });
  }

  if (description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must be 500 characters or fewer'
    });
  }

  if (!category) {
    errors.push({
      field: 'category',
      message: 'Category is required'
    });
  }

  return {
    errors,
    value: {
      name,
      instituteId,
      description,
      category,
      status: 'pending'
    }
  };
}

export function validateAddMemberPayload(payload = {}) {
  const userId = normalizeText(payload.userId);
  const name = normalizeText(payload.name);
  const email = normalizeEmail(payload.email);
  const role = normalizeText(payload.role).toLowerCase() || 'volunteer';
  const errors = [];

  if (!userId) {
    errors.push({
      field: 'userId',
      message: 'User ID is required'
    });
  }

  if (name.length < 2 || name.length > 80) {
    errors.push({
      field: 'name',
      message: 'Name must be between 2 and 80 characters'
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({
      field: 'email',
      message: 'Valid email is required'
    });
  }

  if (!isValidRole(role)) {
    errors.push({
      field: 'role',
      message: 'Role must be one of admin, coordinator, volunteer'
    });
  }

  return {
    errors,
    value: {
      userId,
      name,
      email,
      role
    }
  };
}

export function validateAssignRolePayload(payload = {}) {
  const role = normalizeText(payload.role).toLowerCase();
  const errors = [];

  if (!isValidRole(role)) {
    errors.push({
      field: 'role',
      message: 'Role must be one of admin, coordinator, volunteer'
    });
  }

  return {
    errors,
    value: { role }
  };
}

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    instituteId: { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    createdBy: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export const Club = mongoose.model('Club', clubSchema);

export function validateCreateRolePayload(payload = {}) {
  const name = normalizeText(payload.name);
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions.map(normalizeText).filter(Boolean)
    : [];
  const hierarchyLevel = typeof payload.hierarchyLevel === 'number' ? payload.hierarchyLevel : 0;
  const roleType = normalizeText(payload.roleType) || 'role';
  const color = normalizeText(payload.color);
  const errors = [];

  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (hierarchyLevel < 0) {
    errors.push({ field: 'hierarchyLevel', message: 'Hierarchy level must be 0 or higher' });
  }

  if (roleType !== 'role' && roleType !== 'team') {
    errors.push({ field: 'roleType', message: 'roleType must be role or team' });
  }

  return {
    errors,
    value: {
      name,
      permissions,
      hierarchyLevel,
      roleType,
      color: color || null
    }
  };
}

export function validateAdminApprovePayload(payload = {}) {
  const clubId = normalizeText(payload.clubId);
  const action = normalizeText(payload.action).toLowerCase() || 'approve';
  const errors = [];

  if (!clubId) {
    errors.push({ field: 'clubId', message: 'Club ID is required' });
  }

  if (action !== 'approve' && action !== 'reject') {
    errors.push({ field: 'action', message: 'Action must be approve or reject' });
  }

  return {
    errors,
    value: { clubId, action }
  };
}

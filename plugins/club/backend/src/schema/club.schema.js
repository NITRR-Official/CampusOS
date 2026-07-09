import { PERMISSIONS } from './role.model.js';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PERMISSIONS = new Set(Object.values(PERMISSIONS));

export function validateCreateClubPayload(payload = {}) {
  const name = normalizeText(payload.name);
  const instituteId = normalizeText(payload.instituteId);
  const description = normalizeText(payload.description);
  const category = normalizeText(payload.category);
  const email = normalizeEmail(payload.email);
  const errors = [];

  if (name.length < 3 || name.length > 120) {
    errors.push({
      field: 'name',
      message: 'Name must be between 3 and 120 characters'
    });
  }

  if (!instituteId) {
    errors.push({ field: 'instituteId', message: 'Institute ID is required' });
  }

  if (description.length > 500) {
    errors.push({
      field: 'description',
      message: 'Description must be 500 characters or fewer'
    });
  }

  if (!category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({
      field: 'email',
      message: 'Valid official club email is required'
    });
  }

  return {
    errors,
    value: {
      name,
      instituteId,
      description,
      category,
      email,
      status: 'pending'
    }
  };
}

export function validateAddMemberPayload(payload = {}) {
  const userId = normalizeText(payload.userId);
  const name = normalizeText(payload.name);
  const email = normalizeEmail(payload.email);
  const role = normalizeText(payload.role) || 'volunteer';
  const errors = [];

  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  }

  if (name.length < 2 || name.length > 80) {
    errors.push({
      field: 'name',
      message: 'Name must be between 2 and 80 characters'
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  if (!role) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  return {
    errors,
    value: { userId, name, email, role }
  };
}

export function validateAssignRolePayload(payload = {}) {
  const role = normalizeText(payload.role);
  const errors = [];

  if (!role) {
    errors.push({ field: 'role', message: 'Role is required' });
  }

  return { errors, value: { role } };
}

export function validateCreateRolePayload(payload = {}) {
  const name = normalizeText(payload.name);
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions
    : [];
  const hierarchyLevel =
    typeof payload.hierarchyLevel === 'number' ? payload.hierarchyLevel : 0;
  const roleType = normalizeText(payload.roleType) === 'team' ? 'team' : 'role';
  const color = normalizeText(payload.color) || null;
  const errors = [];

  if (name.length < 2 || name.length > 50) {
    errors.push({
      field: 'name',
      message: 'Role name must be between 2 and 50 characters'
    });
  }

  for (const perm of permissions) {
    if (!VALID_PERMISSIONS.has(perm)) {
      errors.push({
        field: 'permissions',
        message: `Invalid permission: ${perm}`
      });
    }
  }

  return {
    errors,
    value: { name, permissions, hierarchyLevel, roleType, color }
  };
}

export function validateUpdateRolePayload(payload = {}) {
  const value = {};
  const errors = [];

  if (payload.name !== undefined) {
    const name = normalizeText(payload.name);
    if (name.length < 2 || name.length > 50) {
      errors.push({
        field: 'name',
        message: 'Role name must be between 2 and 50 characters'
      });
    }
    value.name = name;
  }

  if (payload.permissions !== undefined) {
    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions
      : [];
    for (const perm of permissions) {
      if (!VALID_PERMISSIONS.has(perm)) {
        errors.push({
          field: 'permissions',
          message: `Invalid permission: ${perm}`
        });
      }
    }
    value.permissions = permissions;
  }

  if (payload.hierarchyLevel !== undefined) {
    if (typeof payload.hierarchyLevel !== 'number') {
      errors.push({
        field: 'hierarchyLevel',
        message: 'hierarchyLevel must be a number'
      });
    } else {
      value.hierarchyLevel = payload.hierarchyLevel;
    }
  }

  if (payload.color !== undefined) {
    value.color = normalizeText(payload.color) || null;
  }

  return { errors, value };
}

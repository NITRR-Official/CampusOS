import { AppError } from '@campus-os/shared/errors';

export function createRoleService(clubRepository) {
  async function listRoles(clubId) {
    return clubRepository.listRoles(clubId);
  }

  async function createRole(clubId, payload) {
    const role = await clubRepository.createRole({
      clubId,
      name: payload.name,
      permissions: payload.permissions || [],
      hierarchyLevel: payload.hierarchyLevel || 0,
      roleType: payload.roleType || 'role',
      color: payload.color || null,
      isTemplate: false
    });
    return role;
  }

  async function updateRole(clubId, roleId, payload) {
    const existingRole = await clubRepository.findRoleById(clubId, roleId);
    if (!existingRole) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    if (existingRole.name === 'owner') {
      if (
        payload.hierarchyLevel !== undefined &&
        payload.hierarchyLevel !== existingRole.hierarchyLevel
      ) {
        throw new AppError(
          'Cannot modify hierarchy level of the owner role',
          403,
          'OWNER_ROLE_PROTECTED'
        );
      }
      if (payload.name !== undefined && payload.name !== 'owner') {
        throw new AppError(
          'Cannot rename the owner role',
          403,
          'OWNER_ROLE_PROTECTED'
        );
      }
    }

    const role = await clubRepository.updateRole(clubId, roleId, payload);
    return role;
  }

  async function deleteRole(clubId, roleId) {
    const role = await clubRepository.findRoleById(clubId, roleId);
    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    if (role.isTemplate) {
      throw new AppError('Cannot delete a template role', 403, 'TEMPLATE_ROLE');
    }

    const deleted = await clubRepository.deleteRole(clubId, roleId);
    if (deleted) {
      await clubRepository.removeRoleFromAllMembers(clubId, roleId);
    }
    return deleted;
  }

  async function systemAddPermissionsToRole(clubId, roleId, permissions) {
    if (!clubId || !roleId || !permissions || permissions.length === 0)
      return null;
    return clubRepository.addPermissionsToRole(clubId, roleId, permissions);
  }

  async function findRoleById(clubId, roleId) {
    return clubRepository.findRoleById(clubId, roleId);
  }

  async function findRoleByName(clubId, roleName) {
    return clubRepository.findRoleByName(clubId, roleName);
  }

  return {
    listRoles,
    createRole,
    updateRole,
    deleteRole,
    systemAddPermissionsToRole,
    findRoleById,
    findRoleByName
  };
}

export default createRoleService;

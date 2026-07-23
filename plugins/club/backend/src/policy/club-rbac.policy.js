export function createClubRbacPolicy(clubRepository, permissionsRegistry) {
  async function getContext(clubId, user) {
    if (!user) {
      return {
        maxHierarchy: -1,
        permissions: new Set(),
        isClubAdmin: false,
        isMember: false
      };
    }
    if (user.isSuperAdmin) {
      return {
        maxHierarchy: 999999,
        permissions: new Set(),
        isClubAdmin: true,
        isMember: true
      };
    }

    const member = await clubRepository.findMemberWithRoles(
      clubId,
      user.id || user._id
    );
    if (!member) {
      return {
        maxHierarchy: -1,
        permissions: new Set(),
        isClubAdmin: false,
        isMember: false
      };
    }

    if (!member.roles || member.roles.length === 0) {
      return {
        maxHierarchy: -1,
        permissions: new Set(),
        isClubAdmin: false,
        isMember: true
      };
    }

    let maxHierarchy = -1;
    const permissions = new Set();
    let isClubAdmin = false;

    for (const role of member.roles) {
      if (role.hierarchyLevel > maxHierarchy) {
        maxHierarchy = role.hierarchyLevel;
      }
      if (role.permissions) {
        for (const perm of role.permissions) {
          permissions.add(perm);
          if (perm === 'administrator') {
            isClubAdmin = true;
          }
        }
      }
    }

    if (isClubAdmin) {
      maxHierarchy = 999999;
    }

    return { maxHierarchy, permissions, isClubAdmin, isMember: true };
  }

  function assertPermissions(requestedPerms, context) {
    if (context.isClubAdmin) return;
    if (!requestedPerms || requestedPerms.length === 0) return;

    for (const perm of requestedPerms) {
      if (!context.permissions.has(perm)) {
        const error = new Error(
          `Cannot assign permission '${perm}' because you do not possess it`
        );
        error.code = 'PERMISSION_ESCALATION';
        throw error;
      }
    }
  }

  function assertHierarchy(targetHierarchy, context, actionDescription) {
    if (context.isClubAdmin) return;
    if (targetHierarchy >= context.maxHierarchy) {
      const error = new Error(
        `Cannot ${actionDescription} a role with hierarchy level ${targetHierarchy} (your highest is ${context.maxHierarchy})`
      );
      error.code = 'HIERARCHY_ESCALATION';
      throw error;
    }
  }

  function validatePermissionsExist(permissions) {
    if (permissions && permissionsRegistry) {
      for (const perm of permissions) {
        if (perm !== 'administrator' && !permissionsRegistry.has(perm)) {
          const error = new Error(`Invalid permission: ${perm}`);
          error.code = 'INVALID_PERMISSION';
          throw error;
        }
      }
    }
  }

  return {
    getContext,
    assertPermissions,
    assertHierarchy,
    validatePermissionsExist
  };
}

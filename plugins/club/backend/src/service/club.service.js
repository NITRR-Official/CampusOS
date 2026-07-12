import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

async function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function serializeClub(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    name: doc.name,
    slug: doc.slug,
    email: doc.email,
    instituteId: doc.instituteId,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    createdBy: doc.createdBy,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt)
  };
}

function serializeClubMember(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    userId: doc.userId,
    clubId: doc.clubId,
    roles: doc.roles || [],
    joinedAt: toIso(doc.joinedAt)
  };
}

export function createClubService(clubRepository, eventBus, registry) {
  async function createClub({
    name,
    email,
    instituteId,
    description,
    category,
    createdBy
  }) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const club = await clubRepository.createClub({
      name,
      slug,
      email,
      instituteId,
      description: description || null,
      category: category || 'General',
      status: 'pending_verification',
      createdBy
    });

    if (eventBus) {
      eventBus.emit('club.proposed', club);
    }

    return serializeClub(club);
  }

  async function listClubs(status) {
    const filter = status ? { status } : {};
    const clubs = await clubRepository.listClubs(filter);
    return clubs.map(serializeClub);
  }

  async function getClub(clubId) {
    if (!clubId) return null;
    const club = await clubRepository.getClubById(clubId);
    return serializeClub(club);
  }

  async function updateClubStatus(clubId, status) {
    const club = await clubRepository.updateClubStatus(clubId, status);

    if (!club) return null;

    if (status === 'approved') {
      const existingRolesCount = await clubRepository.countRoles(clubId);
      if (existingRolesCount === 0) {
        await _provisionDefaultRoles(clubId);
        await _provisionOwnerAccount(club);
      }
    }

    return serializeClub(club);
  }

  async function updateClub(clubId, payload, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);
    _assertPermissions(['club:manage'], context);

    // Only allow updating safe fields
    const updateData = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.description !== undefined)
      updateData.description = payload.description;
    if (payload.category !== undefined) updateData.category = payload.category;
    if (payload.email !== undefined) updateData.email = payload.email;

    const club = await clubRepository.updateClub(clubId, updateData);
    return serializeClub(club);
  }

  async function archiveClub(clubId, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);

    // Only the 'owner' (hierarchy >= 1000) or superadmin can archive
    if (
      !context.isClubAdmin ||
      (context.maxHierarchy < 1000 && !requesterUser.isSuperAdmin)
    ) {
      const error = new Error('Only the club owner can archive the club');
      error.code = 'OWNER_REQUIRED';
      throw error;
    }

    const club = await clubRepository.updateClubStatus(clubId, 'archived');

    if (eventBus && club) {
      eventBus.emit('club:archived', { clubId });
    }

    return serializeClub(club);
  }

  async function deleteClub(clubId, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);

    if (
      !context.isClubAdmin ||
      (context.maxHierarchy < 1000 && !requesterUser.isSuperAdmin)
    ) {
      const error = new Error('Only the club owner can delete the club');
      error.code = 'OWNER_REQUIRED';
      throw error;
    }

    const deleted = await clubRepository.deleteClub(clubId);

    if (deleted && eventBus) {
      eventBus.emit('club:deleted', { clubId });
    }

    return deleted;
  }

  async function _provisionDefaultRoles(clubId) {
    const roles = await clubRepository.createRoles([
      {
        clubId,
        name: 'owner',
        permissions: ['administrator'],
        hierarchyLevel: 1000,
        isTemplate: true,
        color: '#ff4d4f'
      },
      {
        clubId,
        name: 'admin',
        permissions: ['administrator'],
        hierarchyLevel: 100,
        isTemplate: true
      },
      {
        clubId,
        name: 'coordinator',
        permissions: ['event:create', 'event:manage', 'member:manage'],
        hierarchyLevel: 50,
        isTemplate: true
      },
      {
        clubId,
        name: 'volunteer',
        permissions: [],
        hierarchyLevel: 10,
        isTemplate: true
      }
    ]);
    return roles.filter((r) => r.name === 'admin' || r.name === 'owner');
  }

  async function _provisionOwnerAccount(club) {
    let ownerUser = await clubRepository.findUserByEmail(club.email);

    if (!ownerUser) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await createPasswordHash(randomPassword);
      ownerUser = await clubRepository.createUser({
        name: `${club.name} (Official)`,
        email: club.email,
        passwordHash,
        isSuperAdmin: false
      });
    }

    await assignRole(club._id, ownerUser._id || ownerUser.id, 'owner', {
      isSuperAdmin: true
    });

    if (club.createdBy && club.createdBy !== 'unknown') {
      const creator = await clubRepository.findUserById(club.createdBy);
      if (creator) {
        // Creator gets Admin role (Hierarchy 100) instead of Owner (Hierarchy 1000)
        await assignRole(club._id, creator._id || creator.id, 'admin', {
          isSuperAdmin: true
        });
      }
    }
  }

  async function _getRequesterContext(clubId, user) {
    if (!user) {
      return { maxHierarchy: -1, permissions: new Set(), isClubAdmin: false };
    }
    if (user.isSuperAdmin) {
      return {
        maxHierarchy: Infinity,
        permissions: new Set(),
        isClubAdmin: true
      };
    }

    const member = await clubRepository.findMemberWithRoles(
      clubId,
      user.id || user._id
    );
    if (!member || !member.roles || member.roles.length === 0) {
      return { maxHierarchy: -1, permissions: new Set(), isClubAdmin: false };
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
      maxHierarchy = Infinity;
    }

    return { maxHierarchy, permissions, isClubAdmin };
  }

  function _assertPermissions(requestedPerms, context) {
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

  function _assertHierarchy(targetHierarchy, context, actionDescription) {
    if (context.isClubAdmin) return;
    if (targetHierarchy >= context.maxHierarchy) {
      const error = new Error(
        `Cannot ${actionDescription} a role with hierarchy level ${targetHierarchy} (your highest is ${context.maxHierarchy})`
      );
      error.code = 'HIERARCHY_ESCALATION';
      throw error;
    }
  }

  async function addMember(clubId, memberData, requesterUser) {
    const club = await clubRepository.getClubById(clubId);
    if (!club) return null;

    const context = await _getRequesterContext(clubId, requesterUser);

    const user = await clubRepository.findUserByEmail(memberData.email);
    if (!user) {
      const error = new Error('User not found on the platform');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const userId = user._id || user.id;

    const existingMember = await clubRepository.findMember(clubId, userId);
    if (existingMember) {
      const error = new Error('Member already exists in this club');
      error.code = 'MEMBER_EXISTS';
      throw error;
    }

    const assignedRole = await clubRepository.findRole(
      clubId,
      memberData.role || 'volunteer'
    );

    if (!assignedRole) {
      const error = new Error(
        `Role '${memberData.role || 'volunteer'}' not found in club`
      );
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    if (assignedRole) {
      _assertHierarchy(
        assignedRole.hierarchyLevel,
        context,
        'assign initial role to'
      );
    }

    const rolesArray = [assignedRole._id];

    const clubMember = await clubRepository.createClubMember({
      userId,
      clubId,
      roles: rolesArray
    });

    return serializeClubMember(clubMember);
  }

  async function removeMember(clubId, memberUserId, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);
    const targetContext = await _getRequesterContext(clubId, {
      id: memberUserId
    });

    _assertHierarchy(targetContext.maxHierarchy, context, 'remove member with');

    return clubRepository.deleteMember(clubId, memberUserId);
  }

  async function assignRole(clubId, memberUserId, roleName, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);

    const role = await clubRepository.findRole(clubId, roleName);

    if (!role) {
      const error = new Error(`Role ${roleName} not found in club`);
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    _assertHierarchy(role.hierarchyLevel, context, 'assign');

    const member = await clubRepository.addRoleToMember(
      clubId,
      memberUserId,
      role._id
    );

    if (!member) {
      return undefined;
    }

    return serializeClubMember(member);
  }

  async function removeRoleFromMember(
    clubId,
    memberUserId,
    roleName,
    requesterUser
  ) {
    const context = await _getRequesterContext(clubId, requesterUser);

    const role = await clubRepository.findRole(clubId, roleName);
    if (!role) {
      const error = new Error(`Role ${roleName} not found in club`);
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    _assertHierarchy(role.hierarchyLevel, context, 'revoke');

    const member = await clubRepository.removeRoleFromMember(
      clubId,
      memberUserId,
      role._id
    );

    if (!member) {
      return undefined;
    }

    return serializeClubMember(member);
  }

  async function listMembers(clubId) {
    const members = await clubRepository.listMembers(clubId);
    return members.map(serializeClubMember);
  }

  async function removeAllUserMemberships(userId) {
    return clubRepository.removeAllUserMemberships(userId);
  }

  async function getUserPermissions(userId, clubId) {
    if (!clubId || !userId) return [];

    const member = await clubRepository.findMemberWithRoles(clubId, userId);
    if (!member || !member.roles || member.roles.length === 0) return [];

    const permissionsSet = new Set();
    for (const role of member.roles) {
      if (role && role.permissions) {
        for (const perm of role.permissions) {
          permissionsSet.add(perm);
        }
      }
    }

    return Array.from(permissionsSet);
  }

  async function getUserContext(clubId, userId) {
    return _getRequesterContext(clubId, { id: userId });
  }

  async function listRoles(clubId) {
    return clubRepository.listRoles(clubId);
  }

  async function createRole(clubId, payload, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);
    _assertPermissions(['role:manage'], context);

    if (payload.permissions && registry && registry.permissions) {
      for (const perm of payload.permissions) {
        if (perm !== 'administrator' && !registry.permissions.has(perm)) {
          const error = new Error(`Invalid permission: ${perm}`);
          error.code = 'INVALID_PERMISSION';
          throw error;
        }
      }
    }

    const hierarchyLevel = payload.hierarchyLevel || 0;
    _assertHierarchy(hierarchyLevel, context, 'create');
    _assertPermissions(payload.permissions, context);

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

  async function updateRole(clubId, roleId, payload, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);
    _assertPermissions(['role:manage'], context);

    if (payload.permissions && registry && registry.permissions) {
      for (const perm of payload.permissions) {
        if (perm !== 'administrator' && !registry.permissions.has(perm)) {
          const error = new Error(`Invalid permission: ${perm}`);
          error.code = 'INVALID_PERMISSION';
          throw error;
        }
      }
    }

    const existingRole = await clubRepository.findRoleById(clubId, roleId);
    if (!existingRole) return null;

    _assertHierarchy(existingRole.hierarchyLevel, context, 'modify');

    if (payload.hierarchyLevel !== undefined) {
      _assertHierarchy(payload.hierarchyLevel, context, 'update to');
    }

    if (payload.permissions !== undefined) {
      const newPerms = payload.permissions.filter(
        (p) => !existingRole.permissions.includes(p)
      );
      _assertPermissions(newPerms, context);
    }

    const role = await clubRepository.updateRole(clubId, roleId, payload);
    return role;
  }

  async function deleteRole(clubId, roleId, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);

    const role = await clubRepository.findRoleById(clubId, roleId);
    if (!role) return null;

    _assertHierarchy(role.hierarchyLevel, context, 'delete');

    if (role.isTemplate) {
      const error = new Error('Cannot delete a template role');
      error.code = 'TEMPLATE_ROLE';
      throw error;
    }

    const deleted = await clubRepository.deleteRole(clubId, roleId);
    if (deleted) {
      await clubRepository.removeRoleFromAllMembers(clubId, roleId);
    }
    return deleted;
  }

  return {
    createClub,
    listClubs,
    getClub,
    updateClubStatus,
    updateClub,
    archiveClub,
    deleteClub,
    addMember,
    removeMember,
    removeAllUserMemberships,
    assignRole,
    removeRoleFromMember,
    listMembers,
    getUserPermissions,
    getUserContext,
    listRoles,
    createRole,
    updateRole,
    deleteRole
  };
}

export default createClubService;

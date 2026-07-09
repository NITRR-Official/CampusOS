import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { PERMISSIONS } from '../schema/role.model.js';

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

export function createClubService(clubRepository) {
  async function createClub({
    name,
    email,
    instituteId,
    description,
    category,
    createdBy
  }) {
    const club = await clubRepository.createClub({
      name,
      email,
      instituteId,
      description: description || null,
      category: category || 'General',
      status: 'pending',
      createdBy
    });
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
        const adminRole = await _provisionDefaultRoles(clubId);
        await _provisionOwnerAccount(club, adminRole._id);
      }
    }

    return serializeClub(club);
  }

  async function _provisionDefaultRoles(clubId) {
    const roles = await clubRepository.createRoles([
      {
        clubId,
        name: 'admin',
        permissions: [PERMISSIONS.ADMINISTRATOR],
        hierarchyLevel: 100,
        isTemplate: true
      },
      {
        clubId,
        name: 'coordinator',
        permissions: [
          PERMISSIONS.EVENT_CREATE,
          PERMISSIONS.EVENT_MANAGE,
          PERMISSIONS.MEMBER_MANAGE
        ],
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
    return roles.find((r) => r.name === 'admin');
  }

  async function _provisionOwnerAccount(club, adminRoleId) {
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

    await assignRole(club._id, ownerUser._id || ownerUser.id, adminRoleId, {
      isSuperAdmin: true
    });

    if (club.createdBy && club.createdBy !== 'unknown') {
      const creator = await clubRepository.findUserById(club.createdBy);
      if (creator) {
        await assignRole(club._id, creator._id || creator.id, adminRoleId, {
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
          if (perm === PERMISSIONS.ADMINISTRATOR) {
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

  async function addMember(clubId, member) {
    const club = await clubRepository.getClubById(clubId);
    if (!club) return null;

    const existingMember = await clubRepository.findMember(
      clubId,
      member.userId
    );
    if (existingMember) {
      const error = new Error('Member already exists in this club');
      error.code = 'MEMBER_EXISTS';
      throw error;
    }

    const assignedRole = await clubRepository.findRole(
      clubId,
      member.role || 'volunteer'
    );
    const rolesArray = assignedRole ? [assignedRole._id] : [];

    const clubMember = await clubRepository.createClubMember({
      userId: member.userId,
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

  async function listMembers(clubId) {
    const members = await clubRepository.listMembers(clubId);
    return members.map(serializeClubMember);
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

  async function listRoles(clubId) {
    return clubRepository.listRoles(clubId);
  }

  async function createRole(clubId, payload, requesterUser) {
    const context = await _getRequesterContext(clubId, requesterUser);

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
    addMember,
    removeMember,
    assignRole,
    listMembers,
    getUserPermissions,
    listRoles,
    createRole,
    updateRole,
    deleteRole
  };
}

export default createClubService;

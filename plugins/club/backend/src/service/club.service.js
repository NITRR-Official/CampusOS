import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { Club, ClubMember, ClubRole } from '../schema/club.schema.js';

let User;

export function initClubService(registry) {
  const models = registry.getService('core:models');
  if (models && models.User) {
    User = models.User;
  } else {
    throw new Error('core:models service not found in registry');
  }
}

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
    roles: doc.roles || [], // Might be populated roles or IDs
    joinedAt: toIso(doc.joinedAt)
  };
}

class ClubService {
  async createClub({
    name,
    email,
    instituteId,
    description,
    category,
    createdBy
  }) {
    const club = await Club.create({
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

  async listClubs(status) {
    const filter = status ? { status } : {};
    const clubs = await Club.find(filter).sort({ createdAt: -1 }).lean();
    return clubs.map(serializeClub);
  }

  async getClub(clubId) {
    if (!clubId) return null;
    const club = await Club.findById(clubId).lean();
    return serializeClub(club);
  }

  async updateClubStatus(clubId, status) {
    const club = await Club.findByIdAndUpdate(
      clubId,
      { status },
      { new: true }
    ).lean();

    if (!club) return null;

    if (status === 'approved') {
      const existingRolesCount = await Role.countDocuments({ clubId });
      if (existingRolesCount === 0) {
        const adminRole = await this._provisionDefaultRoles(clubId);
        await this._provisionOwnerAccount(club, adminRole._id);
      }
    }

    return serializeClub(club);
  }

  async _provisionDefaultRoles(clubId) {
    const roles = await Role.create([
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

  async _provisionOwnerAccount(club, adminRoleId) {
    let ownerUser = await User.findOne({ email: club.email }).lean();

    if (!ownerUser) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await createPasswordHash(randomPassword);
      ownerUser = await User.create({
        name: `${club.name} (Official)`,
        email: club.email,
        passwordHash,
        isSuperAdmin: false
      });
    }

    // Assign admin to the official club email account
    await this.assignRole(
      club._id,
      ownerUser._id || ownerUser.id,
      adminRoleId,
      { isSuperAdmin: true }
    );

    // Also assign admin to the user who requested the club, if valid
    if (club.createdBy && club.createdBy !== 'unknown') {
      const creator = await User.findById(club.createdBy).lean();
      if (creator) {
        await this.assignRole(
          club._id,
          creator._id || creator.id,
          adminRoleId,
          { isSuperAdmin: true }
        );
      }
    }
  }

  // ==== HIERARCHY & ESCALATION GUARDRAILS ====

  async _getRequesterContext(clubId, user) {
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

    const member = await ClubMember.findOne({
      clubId,
      userId: user.id || user._id
    })
      .populate('roles')
      .lean();
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

  _assertPermissions(requestedPerms, context) {
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

  _assertHierarchy(targetHierarchy, context, actionDescription) {
    if (context.isClubAdmin) return;
    if (targetHierarchy >= context.maxHierarchy) {
      const error = new Error(
        `Cannot ${actionDescription} a role with hierarchy level ${targetHierarchy} (your highest is ${context.maxHierarchy})`
      );
      error.code = 'HIERARCHY_ESCALATION';
      throw error;
    }
  }

  // ==== MEMBER MANAGEMENT ====

  async addMember(clubId, member) {
    const club = await Club.findById(clubId).lean();
    if (!club) return null;

    const existingMember = await ClubMember.findOne({
      clubId,
      userId: member.userId
    }).lean();
    if (existingMember) {
      const error = new Error('Member already exists in this club');
      error.code = 'MEMBER_EXISTS';
      throw error;
    }

    let assignedRole = await Role.findOne({
      clubId,
      name: member.role || 'volunteer'
    }).lean();
    let rolesArray = assignedRole ? [assignedRole._id] : [];

    const clubMember = await ClubMember.create({
      userId: member.userId,
      clubId,
      roles: rolesArray
    });

    return serializeClubMember(clubMember);
  }

  async removeMember(clubId, memberUserId, requesterUser) {
    const context = await this._getRequesterContext(clubId, requesterUser);
    const targetContext = await this._getRequesterContext(clubId, {
      id: memberUserId
    });

    this._assertHierarchy(
      targetContext.maxHierarchy,
      context,
      'remove member with'
    );

    const result = await ClubMember.deleteOne({ clubId, userId: memberUserId });
    return result.deletedCount > 0;
  }

  async assignRole(clubId, memberUserId, roleName, requesterUser) {
    const context = await this._getRequesterContext(clubId, requesterUser);

    const role = await Role.findOne({
      clubId,
      $or: [{ _id: roleName }, { name: roleName }]
    }).lean();

    if (!role) {
      const error = new Error(`Role ${roleName} not found in club`);
      error.code = 'ROLE_NOT_FOUND';
      throw error;
    }

    this._assertHierarchy(role.hierarchyLevel, context, 'assign');

    const member = await ClubMember.findOneAndUpdate(
      { clubId, userId: memberUserId },
      { $addToSet: { roles: role._id } },
      { new: true }
    ).lean();

    if (!member) {
      // If member doesn't exist yet, we might want to create them. But let's assume they must exist.
      return undefined;
    }

    return serializeClubMember(member);
  }

  async listMembers(clubId) {
    const members = await ClubMember.find({ clubId }).populate('roles').lean();
    return members.map(serializeClubMember);
  }

  async getUserPermissions(userId, clubId) {
    if (!clubId || !userId) return [];

    const member = await ClubMember.findOne({ clubId, userId })
      .populate('roles')
      .lean();
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

  // ==== ROLE MANAGEMENT ====

  async listRoles(clubId) {
    const roles = await Role.find({ clubId })
      .sort({ hierarchyLevel: -1, createdAt: 1 })
      .lean();
    return roles;
  }

  async createRole(clubId, payload, requesterUser) {
    const context = await this._getRequesterContext(clubId, requesterUser);

    const hierarchyLevel = payload.hierarchyLevel || 0;
    this._assertHierarchy(hierarchyLevel, context, 'create');
    this._assertPermissions(payload.permissions, context);

    const role = await Role.create({
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

  async updateRole(clubId, roleId, payload, requesterUser) {
    const context = await this._getRequesterContext(clubId, requesterUser);

    const existingRole = await Role.findOne({ _id: roleId, clubId }).lean();
    if (!existingRole) return null;

    this._assertHierarchy(existingRole.hierarchyLevel, context, 'modify');

    if (payload.hierarchyLevel !== undefined) {
      this._assertHierarchy(payload.hierarchyLevel, context, 'update to');
    }

    if (payload.permissions !== undefined) {
      const newPerms = payload.permissions.filter(
        (p) => !existingRole.permissions.includes(p)
      );
      this._assertPermissions(newPerms, context);
    }

    const role = await Role.findOneAndUpdate(
      { _id: roleId, clubId },
      { $set: payload },
      { new: true }
    ).lean();
    return role;
  }

  async deleteRole(clubId, roleId, requesterUser) {
    const context = await this._getRequesterContext(clubId, requesterUser);

    const role = await Role.findOne({ _id: roleId, clubId }).lean();
    if (!role) return null;

    this._assertHierarchy(role.hierarchyLevel, context, 'delete');

    if (role.isTemplate) {
      const error = new Error('Cannot delete a template role');
      error.code = 'TEMPLATE_ROLE';
      throw error;
    }

    const result = await Role.deleteOne({ _id: roleId, clubId });
    if (result.deletedCount > 0) {
      // Optional: remove role from all members
      await ClubMember.updateMany(
        { clubId, roles: roleId },
        { $pull: { roles: roleId } }
      );
    }
    return result.deletedCount > 0;
  }
}

const clubService = new ClubService();

export function getClubService() {
  return clubService;
}

export default getClubService;

import { AppError } from '@campus-os/shared/errors';
import { serializeClubMember } from '../serializers/club.serializer.js';

export function createMemberService(clubRepository, authService, eventBus) {
  async function addMember(clubId, memberData, assignedRole) {
    const user = await authService.getUserByEmail(memberData.email);

    if (!user) {
      throw new AppError(
        'User not found on the platform',
        404,
        'USER_NOT_FOUND'
      );
    }

    const userId = user._id || user.id;

    const existingMember = await clubRepository.findMember(clubId, userId);
    if (existingMember) {
      throw new AppError(
        'Member already exists in this club',
        409,
        'MEMBER_EXISTS'
      );
    }

    if (!assignedRole) {
      throw new AppError(
        `Role '${memberData.role || 'volunteer'}' not found in club`,
        404,
        'ROLE_NOT_FOUND'
      );
    }

    const rolesArray = [assignedRole._id];

    const clubMember = await clubRepository.createClubMember({
      userId,
      clubId,
      roles: rolesArray
    });

    const serialized = serializeClubMember(clubMember);
    if (eventBus) {
      eventBus.emit('club:member:added', {
        clubId,
        memberUserId: userId,
        roleId: assignedRole._id
      });
    }
    return serialized;
  }

  async function removeMember(clubId, memberUserId) {
    const deleted = await clubRepository.deleteMember(clubId, memberUserId);
    if (deleted && eventBus) {
      eventBus.emit('club:member:removed', {
        clubId,
        memberUserId
      });
    }
    return deleted;
  }

  async function assignRole(clubId, memberUserId, role) {
    if (!role) {
      throw new AppError(`Role not found in club`, 404, 'ROLE_NOT_FOUND');
    }

    const member = await clubRepository.addRoleToMember(
      clubId,
      memberUserId,
      role._id
    );

    if (!member) {
      return undefined; // Handled as member not found
    }

    const serialized = serializeClubMember(member);
    if (eventBus) {
      eventBus.emit('club:role:assigned', {
        clubId,
        memberUserId,
        roleId: role._id
      });
    }
    return serialized;
  }

  async function removeRoleFromMember(clubId, memberUserId, role) {
    if (!role) {
      throw new AppError(`Role not found in club`, 404, 'ROLE_NOT_FOUND');
    }

    const member = await clubRepository.removeRoleFromMember(
      clubId,
      memberUserId,
      role._id
    );

    if (!member) {
      return undefined; // Handled as member not found
    }

    return serializeClubMember(member);
  }

  async function listMembers(clubId, { page = 1, limit = 50 } = {}) {
    const members = await clubRepository.listMembers(clubId, { page, limit });

    const userIds = members.map((m) => m.userId);
    let users = [];
    if (authService && userIds.length > 0) {
      users = await authService.getUsersByIds(userIds);
    }

    const userMap = new Map();
    for (const user of users) {
      userMap.set((user.id || user._id).toString(), user);
    }

    return members.map((m) => {
      const serialized = serializeClubMember(m);
      if (serialized) {
        serialized.user = userMap.get(m.userId.toString()) || null;
      }
      return serialized;
    });
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

  return {
    addMember,
    removeMember,
    assignRole,
    removeRoleFromMember,
    listMembers,
    removeAllUserMemberships,
    getUserPermissions
  };
}

export default createMemberService;

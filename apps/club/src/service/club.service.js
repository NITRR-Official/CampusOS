import { Club } from '../schema/club.schema.js';
import { Role } from '../schema/role.schema.js';
import { ClubMember } from '../schema/clubmember.schema.js';
import { User } from '../../../../backend/src/database/schemas/user.schema.js';
import crypto from 'node:crypto';

class ClubService {
  async createClub({ name, instituteId, description, createdBy, email }) {
    const fallbackEmail = `${name.toLowerCase().replace(/\s+/g, '')}@campusos.org`;
    const club = await Club.create({
      name,
      instituteId,
      description: description || null,
      createdBy,
      email: email || fallbackEmail
    });
    return club;
  }

  async listClubs() {
    return await Club.find({});
  }

  async addMember(clubId, member) {
    const clubExist = await Club.findById(clubId);
    if (!clubExist) {
      return null;
    }

    const exists = await ClubMember.findOne({ userId: member.userId, clubId });
    if (exists) {
      const error = new Error('Member already exists in this club');
      error.code = 'MEMBER_EXISTS';
      throw error;
    }

    const clubMember = await ClubMember.create({
      userId: member.userId,
      clubId: clubId,
      roles: []
    });
    return clubMember;
  }

  async removeMember(clubId, memberUserId) {
    const result = await ClubMember.deleteOne({ clubId, userId: memberUserId });
    return result.deletedCount > 0;
  }

  async assignRole(clubId, memberUserId, roleId) {
    const member = await ClubMember.findOne({ clubId, userId: memberUserId });
    if (!member) {
      return null;
    }

    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      return undefined;
    }

    if (!member.roles.includes(roleId)) {
      member.roles.push(roleId);
      await member.save();
    }

    return member;
  }

  // --- Phase 2: Role Management & Templates ---

  async listRoles(clubId) {
    return await Role.find({ clubId });
  }

  async createRole(clubId, roleData) {
    return await Role.create({
      clubId,
      ...roleData
    });
  }

  async approveClubPipeline(clubId) {
    const club = await Club.findById(clubId);
    if (!club) {
      return null;
    }

    club.status = 'approved';
    await club.save();

    // Check/provision Owner User Account
    let ownerUser = await User.findOne({ email: club.email });
    let tempPassword = null;

    if (!ownerUser) {
      tempPassword = crypto.randomBytes(12).toString('hex');
      const authServiceModule =
        await import('../../../auth/src/service/auth.service.js');
      const authService = authServiceModule.getAuthService();

      ownerUser = await authService.createUser({
        name: `${club.name} Owner`,
        email: club.email,
        password: tempPassword
      });
    }

    // Pre-populate default template roles
    const templates = [
      {
        name: 'Overall Coordinator',
        permissions: ['administrator'],
        hierarchyLevel: 100,
        color: '#E91E63'
      },
      {
        name: 'Head Coordinator',
        permissions: [
          'club:manage',
          'member:manage',
          'event:create',
          'event:manage',
          'budget:view',
          'budget:manage',
          'task:manage'
        ],
        hierarchyLevel: 80,
        color: '#9C27B0'
      },
      {
        name: 'Core Coordinator',
        permissions: [
          'member:manage',
          'event:create',
          'event:manage',
          'budget:view',
          'task:manage'
        ],
        hierarchyLevel: 60,
        color: '#3F51B5'
      },
      {
        name: 'Executive',
        permissions: ['event:create', 'task:manage'],
        hierarchyLevel: 40,
        color: '#00BCD4'
      },
      {
        name: 'Volunteer',
        permissions: [],
        hierarchyLevel: 20,
        color: '#4CAF50'
      }
    ];

    const createdRoles = [];
    for (const t of templates) {
      // Check if role already exists (to prevent duplicates if pipeline runs twice)
      let role = await Role.findOne({
        clubId: club._id.toString(),
        name: t.name
      });
      if (!role) {
        role = await Role.create({
          clubId: club._id.toString(),
          name: t.name,
          permissions: t.permissions,
          hierarchyLevel: t.hierarchyLevel,
          isTemplate: false,
          roleType: 'role',
          color: t.color
        });
      }
      createdRoles.push(role);
    }

    const overallCoordinatorRole = createdRoles.find(
      (r) => r.name === 'Overall Coordinator'
    );

    // Assign owner account to Overall Coordinator role
    const ownerMemberExists = await ClubMember.findOne({
      userId: ownerUser.id || ownerUser._id,
      clubId: club._id.toString()
    });
    if (!ownerMemberExists) {
      await ClubMember.create({
        userId: ownerUser.id || ownerUser._id,
        clubId: club._id.toString(),
        roles: [overallCoordinatorRole._id]
      });
    }

    // Assign creator to Overall Coordinator role
    if (club.createdBy && club.createdBy !== 'unknown') {
      const creatorMemberExists = await ClubMember.findOne({
        userId: club.createdBy,
        clubId: club._id.toString()
      });
      if (!creatorMemberExists) {
        await ClubMember.create({
          userId: club.createdBy,
          clubId: club._id.toString(),
          roles: [overallCoordinatorRole._id]
        });
      }
    }

    return {
      club,
      ownerEmail: club.email,
      ownerUsername: ownerUser.name,
      tempPassword
    };
  }

  async rejectClubPipeline(clubId) {
    const club = await Club.findById(clubId);
    if (!club) {
      return null;
    }

    club.status = 'rejected';
    await club.save();
    return club;
  }
}

const clubService = new ClubService();

export function getClubService() {
  return clubService;
}

export default getClubService;

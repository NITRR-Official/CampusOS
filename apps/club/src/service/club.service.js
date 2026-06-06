import crypto from 'node:crypto';
import { Club } from '../schema/club.schema.js';
import { Role } from '../schema/role.schema.js';
import { ClubMember } from '../schema/clubmemeber.schema.js';
//import { userInfo } from 'node:os';
//const clubsById = new Map();

class ClubService {
  async createClub({ name, instituteId, description, createdBy, email }) {
    /*const club = {
      id: crypto.randomUUID(),
      name,
      instituteId,
      description: description || null,
      createdBy,
      createdAt: new Date().toISOString(),
      members: []
    };*/

    //clubsById.set(club.id, club);


    const fallbackEmail = `${name.toLowerCase().replace(/\s+/g, '')}@campusos.org`;
    const club = await Club.create({
      name,
      instituteId,
      description: description || null,
      createdBy,
      email: email || fallbackEmail,
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
    // result.deletedCount tells us if something was actually removed (1) or not found (0)
    return result.deletedCount > 0;
  }

  async assignRole(clubId, memberUserId, roleId) {
    const member = await ClubMember.findOne({ clubId, userId: memberUserId });
    if (!member) {
      return null;
    }

    const roleExists = await Role.findById(roleId);
    if (!roleExists) return undefined;

    if (!member.roles.includes(roleId)) {
      member.roles.push(roleId);
      await member.save();
    }
    return member;
  }
}

const clubService = new ClubService();

export function getClubService() {
  return clubService;
}

export default getClubService;

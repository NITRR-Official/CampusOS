import crypto from 'node:crypto';

const clubsById = new Map();

class ClubService {
  createClub({ name, instituteId, description, createdBy }) {
    const club = {
      id: crypto.randomUUID(),
      name,
      instituteId,
      description: description || null,
      createdBy,
      createdAt: new Date().toISOString(),
      members: []
    };

    clubsById.set(club.id, club);
    return club;
  }

  listClubs() {
    return Array.from(clubsById.values());
  }

  addMember(clubId, member) {
    const club = clubsById.get(clubId);

    if (!club) {
      return null;
    }

    const exists = club.members.some((item) => item.userId === member.userId);

    if (exists) {
      const error = new Error('Member already exists in this club');
      error.code = 'MEMBER_EXISTS';
      throw error;
    }

    const clubMember = {
      userId: member.userId,
      name: member.name,
      email: member.email,
      role: member.role,
      joinedAt: new Date().toISOString()
    };

    club.members.push(clubMember);
    return clubMember;
  }

  removeMember(clubId, memberUserId) {
    const club = clubsById.get(clubId);

    if (!club) {
      return null;
    }

    const initialCount = club.members.length;
    club.members = club.members.filter(
      (member) => member.userId !== memberUserId
    );

    return club.members.length < initialCount;
  }

  assignRole(clubId, memberUserId, role) {
    const club = clubsById.get(clubId);

    if (!club) {
      return null;
    }

    const member = club.members.find((item) => item.userId === memberUserId);

    if (!member) {
      return undefined;
    }

    member.role = role;
    return member;
  }
}

const clubService = new ClubService();

export function getClubService() {
  return clubService;
}

export default getClubService;

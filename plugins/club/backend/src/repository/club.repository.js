export function createClubRepository(Club, ClubMember, ClubRole, User) {
  // ==== Club Methods ====
  async function createClub(clubData) {
    return Club.create(clubData);
  }

  async function listClubs(filter) {
    return Club.find(filter).sort({ createdAt: -1 }).lean();
  }

  async function getClubById(clubId) {
    return Club.findById(clubId).lean();
  }

  async function updateClubStatus(clubId, status) {
    return Club.findByIdAndUpdate(clubId, { status }, { new: true }).lean();
  }

  async function updateClub(clubId, updateData) {
    return Club.findByIdAndUpdate(
      clubId,
      { $set: updateData },
      { new: true }
    ).lean();
  }

  async function deleteClub(clubId) {
    const result = await Club.deleteOne({ _id: clubId });
    return result.deletedCount > 0;
  }

  // ==== Member Methods ====
  async function createClubMember(memberData) {
    return ClubMember.create(memberData);
  }

  async function findMember(clubId, userId) {
    return ClubMember.findOne({ clubId, userId }).lean();
  }

  async function findMemberWithRoles(clubId, userId) {
    return ClubMember.findOne({ clubId, userId }).populate('roles').lean();
  }

  async function deleteMember(clubId, userId) {
    const result = await ClubMember.deleteOne({ clubId, userId });
    return result.deletedCount > 0;
  }

  async function removeAllUserMemberships(userId) {
    const result = await ClubMember.deleteMany({ userId });
    return result.deletedCount;
  }

  async function addRoleToMember(clubId, userId, roleId) {
    return ClubMember.findOneAndUpdate(
      { clubId, userId },
      {
        $addToSet: { roles: roleId },
        $setOnInsert: { joinedAt: new Date(), status: 'active' }
      },
      { new: true, upsert: true }
    ).lean();
  }

  async function listMembers(clubId) {
    return ClubMember.find({ clubId })
      .populate('roles')
      .populate('userId', 'name email avatar')
      .lean();
  }

  async function removeRoleFromAllMembers(clubId, roleId) {
    return ClubMember.updateMany(
      { clubId, roles: roleId },
      { $pull: { roles: roleId } }
    );
  }

  async function removeRoleFromMember(clubId, userId, roleId) {
    return ClubMember.findOneAndUpdate(
      { clubId, userId },
      { $pull: { roles: roleId } },
      { new: true }
    ).lean();
  }

  // ==== Role Methods ====
  async function countRoles(clubId) {
    return ClubRole.countDocuments({ clubId });
  }

  async function createRoles(rolesData) {
    return ClubRole.create(rolesData);
  }

  async function createRole(roleData) {
    return ClubRole.create(roleData);
  }

  async function findRole(clubId, roleIdentifier) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(roleIdentifier));
    const filter = isObjectId
      ? { $or: [{ _id: roleIdentifier }, { name: roleIdentifier }] }
      : { name: roleIdentifier };

    return ClubRole.findOne({
      clubId,
      ...filter
    }).lean();
  }

  async function findRoleById(clubId, roleId) {
    return ClubRole.findOne({ _id: roleId, clubId }).lean();
  }

  async function listRoles(clubId) {
    return ClubRole.find({ clubId })
      .sort({ hierarchyLevel: -1, createdAt: 1 })
      .lean();
  }

  async function updateRole(clubId, roleId, updateData) {
    return ClubRole.findOneAndUpdate(
      { _id: roleId, clubId },
      { $set: updateData },
      { new: true }
    ).lean();
  }

  async function deleteRole(clubId, roleId) {
    const result = await ClubRole.deleteOne({ _id: roleId, clubId });
    return result.deletedCount > 0;
  }

  // ==== User Methods ====
  async function findUserByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async function findUserById(userId) {
    return User.findById(userId).lean();
  }

  async function createUser(userData) {
    return User.create(userData);
  }

  return {
    createClub,
    listClubs,
    getClubById,
    updateClubStatus,
    updateClub,
    deleteClub,
    createClubMember,
    findMember,
    findMemberWithRoles,
    deleteMember,
    removeAllUserMemberships,
    addRoleToMember,
    listMembers,
    removeRoleFromAllMembers,
    removeRoleFromMember,
    countRoles,
    createRoles,
    createRole,
    findRole,
    findRoleById,
    listRoles,
    updateRole,
    deleteRole,
    findUserByEmail,
    findUserById,
    createUser
  };
}

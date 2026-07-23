export function createClubRepository(Club, ClubMember, ClubRole, User) {
  // ==== Club Methods ====
  async function createClub(clubData) {
    return Club.create(clubData);
  }

  async function listClubs(filter = {}, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const pipeline = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: ClubMember.collection.name,
          localField: '_id',
          foreignField: 'clubId',
          as: 'members'
        }
      },
      {
        $addFields: {
          memberCount: { $size: '$members' }
        }
      },
      { $project: { members: 0 } }
    ];
    return Club.aggregate(pipeline);
  }

  async function getClubById(clubId) {
    return Club.findById(clubId).lean();
  }

  async function getClubBySlug(slug) {
    return Club.findOne({ slug }).lean();
  }

  async function updateClubStatus(clubId, status, options = {}) {
    return Club.findByIdAndUpdate(
      clubId,
      { status },
      { new: true, ...options }
    ).lean();
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
  async function countMembers(clubId) {
    return ClubMember.countDocuments({ clubId });
  }

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

  async function addRoleToMember(clubId, userId, roleId, options = {}) {
    return ClubMember.findOneAndUpdate(
      { clubId, userId },
      {
        $addToSet: { roles: roleId },
        $setOnInsert: { joinedAt: new Date(), status: 'active' }
      },
      { new: true, upsert: true, ...options }
    ).lean();
  }

  async function listMembers(clubId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    return ClubMember.find({ clubId })
      .skip(skip)
      .limit(limit)
      .populate('roles')
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

  async function createRoles(rolesData, options = {}) {
    return ClubRole.insertMany(rolesData, options);
  }

  async function createRole(roleData) {
    return ClubRole.create(roleData);
  }

  async function findRoleByName(clubId, roleName, options = {}) {
    return ClubRole.findOne({ clubId, name: roleName }, null, options).lean();
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

  async function addPermissionsToRole(clubId, roleId, permissions) {
    return ClubRole.findOneAndUpdate(
      { _id: roleId, clubId },
      { $addToSet: { permissions: { $each: permissions } } },
      { new: true }
    ).lean();
  }

  async function deleteRole(clubId, roleId) {
    const result = await ClubRole.deleteOne({ _id: roleId, clubId });
    return result.deletedCount > 0;
  }

  async function withTransaction(callback) {
    const session = await Club.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  return {
    withTransaction,
    createClub,
    listClubs,
    getClubById,
    getClubBySlug,
    updateClubStatus,
    updateClub,
    deleteClub,
    countMembers,
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
    findRoleByName,
    findRoleById,
    listRoles,
    updateRole,
    addPermissionsToRole,
    deleteRole
  };
}

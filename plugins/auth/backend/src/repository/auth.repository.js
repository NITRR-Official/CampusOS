export function createAuthRepository(User) {
  async function findUserByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async function userExists() {
    const exists = await User.exists({});
    return !!exists;
  }

  async function createUser(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      if (error?.code === 11000) {
        const duplicateError = new Error('Email is already registered');
        duplicateError.code = 'EMAIL_ALREADY_EXISTS';
        throw duplicateError;
      }
      throw error;
    }
  }

  async function listUsers({ limit = 50, skip = 0 } = {}) {
    return User.find({}).select('-passwordHash').skip(skip).limit(limit).lean();
  }

  async function deleteUser(userId) {
    const result = await User.deleteOne({ _id: userId });
    return result.deletedCount > 0;
  }

  async function findUserById(userId) {
    return User.findById(userId).lean();
  }

  async function findUsersByIds(userIds) {
    return User.find({ _id: { $in: userIds } }).lean();
  }

  async function updateUser(userId, updateData) {
    return User.findByIdAndUpdate(userId, updateData, {
      returnDocument: 'after'
    }).lean();
  }

  return {
    findUserByEmail,
    findUserById,
    findUsersByIds,
    userExists,
    createUser,
    listUsers,
    deleteUser,
    updateUser
  };
}

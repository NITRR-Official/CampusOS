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

  async function listUsers() {
    return User.find({}).select('-password').lean();
  }

  return {
    findUserByEmail,
    userExists,
    createUser,
    listUsers
  };
}

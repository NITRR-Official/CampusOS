import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

async function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, passwordHash) {
  const [salt, storedKey] = passwordHash.split(':');

  if (!salt || !storedKey) {
    return false;
  }

  const incomingKey = await scryptAsync(password, salt, 64);

  return crypto.timingSafeEqual(incomingKey, Buffer.from(storedKey, 'hex'));
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toISOString()
    : null;

  return {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    isActive: user.isActive,
    createdAt
  };
}

export function createAuthService(authRepository, eventBus) {
  async function createUser({ name, email, password }) {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error('Email is already registered');
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const passwordHash = await createPasswordHash(password);
    const hasUsers = await authRepository.userExists();
    const isSuperAdmin = !hasUsers;

    const user = await authRepository.createUser({
      name,
      email: normalizedEmail,
      passwordHash,
      isSuperAdmin
    });

    if (eventBus) {
      eventBus.emit('user:created', { userId: user.id || user._id });
    }

    return toPublicUser(user);
  }

  async function authenticateUser({ email, password }) {
    const normalizedEmail = email.toLowerCase();
    const user = await authRepository.findUserByEmail(normalizedEmail);

    if (!user) {
      return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return toPublicUser(user);
  }

  async function listUsers() {
    const users = await authRepository.listUsers();
    return users.map(toPublicUser);
  }

  async function deleteUser(userId) {
    const deleted = await authRepository.deleteUser(userId);
    if (deleted && eventBus) {
      eventBus.emit('user:deleted', { userId });
    }
    return deleted;
  }

  async function getUserById(userId) {
    if (!userId) return null;
    const user = await authRepository.findUserById(userId);
    return toPublicUser(user);
  }

  async function getUsersByIds(userIds) {
    if (!userIds || !userIds.length) return [];
    const users = await authRepository.findUsersByIds(userIds);
    return users.map(toPublicUser);
  }

  async function getUserByEmail(email) {
    if (!email) return null;
    const normalizedEmail = email.toLowerCase();
    const user = await authRepository.findUserByEmail(normalizedEmail);
    return toPublicUser(user);
  }

  async function updateUserRole(userId, isSuperAdmin) {
    const user = await authRepository.updateUser(userId, { isSuperAdmin });
    return toPublicUser(user);
  }

  async function updateUserStatus(userId, isActive) {
    const user = await authRepository.updateUser(userId, { isActive });
    return toPublicUser(user);
  }

  return {
    createUser,
    authenticateUser,
    listUsers,
    deleteUser,
    getUserById,
    getUsersByIds,
    getUserByEmail,
    updateUserRole,
    updateUserStatus
  };
}

export default createAuthService;

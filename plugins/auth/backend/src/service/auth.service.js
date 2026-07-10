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
    createdAt
  };
}

export function createAuthService(authRepository) {
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

  return {
    createUser,
    authenticateUser,
    listUsers
  };
}

export default createAuthService;

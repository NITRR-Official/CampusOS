import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { User } from '../../../../backend/src/database/schemas/user.schema.js';

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
    role: user.role,
    createdAt
  };
}

class AuthService {
  async createUser({ name, email, password }) {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      const error = new Error('Email is already registered');
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const passwordHash = await createPasswordHash(password);
    const hasUsers = await User.exists({});
    const role = hasUsers ? 'volunteer' : 'admin';

    try {
      const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        role
      });

      return toPublicUser(user);
    } catch (error) {
      if (error?.code === 11000) {
        const duplicateError = new Error('Email is already registered');
        duplicateError.code = 'EMAIL_ALREADY_EXISTS';
        throw duplicateError;
      }

      throw error;
    }
  }

  async authenticateUser({ email, password }) {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return toPublicUser(user);
  }
}

const authService = new AuthService();

export function getAuthService() {
  return authService;
}

export default getAuthService;

import {
  signupSchema,
  loginSchema,
  updateRoleSchema,
  updateStatusSchema,
  objectIdSchema
} from '../schema/auth.schema.js';

import { AppError } from '@campus-os/shared/errors';
export function createAuthController({ registry, authService }) {
  const jwtAuthenticator = registry.getAuthenticator('jwt');

  if (!jwtAuthenticator) {
    throw new AppError(
      'JWT authenticator is not configured',
      500,
      'JWT_NOT_CONFIGURED'
    );
  }

  function signAccessToken(user) {
    return jwtAuthenticator.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin
    });
  }

  async function signup(req, res, next) {
    try {
      const value = signupSchema.parse(req.body);
      const user = await authService.createUser(value);
      const accessToken = signAccessToken(user);

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
          tokenType: 'Bearer'
        }
      });
    } catch (error) {
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        next(
          new AppError(
            'Email is already registered',
            409,
            'EMAIL_ALREADY_EXISTS'
          )
        );
        return;
      }

      next(error);
    }
  }

  async function login(req, res, next) {
    try {
      const value = loginSchema.parse(req.body);
      const user = await authService.authenticateUser(value);

      if (!user) {
        next(
          new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
        );
        return;
      }

      const accessToken = signAccessToken(user);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
          tokenType: 'Bearer'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async function listUsers(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const skip = parseInt(req.query.skip, 10) || 0;
      const users = await authService.listUsers({ limit, skip });
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  async function getMe(req, res, next) {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  }

  async function updateRole(req, res, next) {
    try {
      const id = objectIdSchema.parse(req.params.id);
      const { isSuperAdmin } = updateRoleSchema.parse(req.body);
      const user = await authService.updateUserRole(id, isSuperAdmin);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async function updateStatus(req, res, next) {
    try {
      const id = objectIdSchema.parse(req.params.id);
      const { isActive } = updateStatusSchema.parse(req.body);
      const user = await authService.updateUserStatus(id, isActive);
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  return {
    signup,
    login,
    listUsers,
    getMe,
    updateRole,
    updateStatus
  };
}

export default createAuthController;

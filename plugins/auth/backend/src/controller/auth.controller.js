import { signupSchema, loginSchema } from '../schema/auth.schema.js';

function createHttpError(status, message, code, details) {
  const error = new Error(message);
  error.status = status;

  if (code) {
    error.code = code;
  }

  if (details) {
    error.details = details;
  }

  return error;
}

export function createAuthController({ registry, authService }) {
  const jwtAuthenticator = registry.getAuthenticator('jwt');

  if (!jwtAuthenticator) {
    throw createHttpError(
      500,
      'JWT authenticator is not configured',
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
          createHttpError(
            409,
            'Email is already registered',
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
          createHttpError(
            401,
            'Invalid email or password',
            'INVALID_CREDENTIALS'
          )
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
      const users = await authService.listUsers();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    signup,
    login,
    listUsers
  };
}

export default createAuthController;

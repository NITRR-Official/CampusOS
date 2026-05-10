import { validateSignupPayload, validateLoginPayload } from '../schema/auth.schema.js';
import { getAuthService } from '../service/auth.service.js';

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

export function createAuthController({ registry }) {
  const authService = getAuthService();
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
      role: user.role
    });
  }

  async function signup(req, res, next) {
    const { errors, value } = validateSignupPayload(req.body);

    if (errors.length > 0) {
      next(
        createHttpError(
          400,
          'Request validation failed',
          'VALIDATION_ERROR',
          errors
        )
      );
      return;
    }

    try {
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
    const { errors, value } = validateLoginPayload(req.body);

    if (errors.length > 0) {
      next(
        createHttpError(
          400,
          'Request validation failed',
          'VALIDATION_ERROR',
          errors
        )
      );
      return;
    }

    try {
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

  return {
    signup,
    login
  };
}

export default createAuthController;

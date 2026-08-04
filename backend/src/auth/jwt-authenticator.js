import jwt from 'jsonwebtoken';

const DEV_FALLBACK_SECRET = 'campus-os-dev-jwt-secret-change-me';

/**
 * Retrieves the JWT Secret
 * @returns JWT secret (String)
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production'
    );
  }

  console.warn('JWT_SECRET is not set. Using development fallback secret.');
  return DEV_FALLBACK_SECRET;
}

export function registerJwtAuthenticator(registry) {
  const secret = getJwtSecret();
  const defaultExpiresIn =
    process.env.JWT_EXPIRES_IN ||
    (process.env.NODE_ENV === 'production' ? '15m' : '7d');
  // JWT Authenticator object
  const jwtAuthenticator = {
    //Signing function
    sign(payload, options = {}) {
      return jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn: options.expiresIn || defaultExpiresIn,
        issuer: 'campus-os-core',
        audience: 'campus-os-clients'
      });
    },
    //Verifying function
    verify(token) {
      try {
        return jwt.verify(token, secret, {
          algorithms: ['HS256'],
          issuer: 'campus-os-core',
          audience: 'campus-os-clients'
        });
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          throw new Error('Token has expired', { cause: error });
        }
        if (error.name === 'JsonWebTokenError') {
          throw new Error('Invalid authentication token', { cause: error });
        }
        throw new Error('Authentication verification failed', { cause: error });
      }
    }
  };

  registry.registerAuthenticator('jwt', jwtAuthenticator);
  return jwtAuthenticator;
}

export default registerJwtAuthenticator;

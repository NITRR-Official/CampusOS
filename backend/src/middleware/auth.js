/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user context to request
 */

// used set because it is easy to search
const PUBLIC_ROUTES = new Set([
  '/health',
  '/api/v1/auth/signup',
  '/api/v1/auth/login'
]);

/**
 * Checks whether an event route is public or not
 * @param {*} req
 * @returns {boolean}
 */
function isPublicEventRoute(req) {
  // event listing route
  if (req.method === 'GET' && req.path === '/api/v1/events') {
    return true;
  }
  // public event route
  if (req.method === 'GET' && /^\/api\/v1\/events\/[^/]+$/.test(req.path)) {
    return true;
  }
  // registrations for that event
  if (
    req.method === 'POST' &&
    /^\/api\/v1\/events\/[^/]+\/registrations$/.test(req.path)
  ) {
    return true;
  }

  return false;
}

export function authMiddleware(req, res, next) {
  if (PUBLIC_ROUTES.has(req.path) || isPublicEventRoute(req)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid authorization token'
    });
  }

  const token = authHeader.substring(7);
  const registry = req.app?.locals?.registry; // optional chaining in case the properties are not present
  const jwtAuthenticator = registry?.getAuthenticator('jwt');

  if (!jwtAuthenticator) {
    return res.status(500).json({
      success: false,
      error: 'Server Misconfiguration',
      message: 'JWT authenticator is not configured'
    });
  }

  try {
    const decoded = jwtAuthenticator.verify(token);

    req.user = {
      id: decoded.sub || decoded.id || null, // both sub and id for wider compatibility
      email: decoded.email || null,
      role: decoded.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Auth verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

export default authMiddleware;

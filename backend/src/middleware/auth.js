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

export function authMiddleware(req, res, next) {
  if (PUBLIC_ROUTES.has(req.path)) {
    return next();
  }

  const registry = req.app?.locals?.registry;
  if (registry) {
    const publicRoutes = registry.getPublicRoutes();
    for (const route of publicRoutes) {
      const methodMatches = !route.method || route.method === req.method;
      if (methodMatches && route.regex.test(req.path)) {
        return next();
      }
    }
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
      role: decoded.role || 'user',
      isSuperAdmin: !!decoded.isSuperAdmin
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

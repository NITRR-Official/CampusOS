const VALID_ROLES = new Set(['admin', 'coordinator', 'volunteer']);

export function isValidRole(role) {
  return VALID_ROLES.has(role);
}

export function requireRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);

  return function roleGuard(req, res, next) {
    //store user role
    const userRole = req.user?.role;
    // check if user exists
    if (!userRole) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User context missing'
      });
    }
    // check if user has required role or not
    if (!allowed.has(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

export default requireRoles;

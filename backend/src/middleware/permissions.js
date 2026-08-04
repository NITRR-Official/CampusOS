import registry from '../utils/registry.js';

export function requirePermissions(...allowedPermissions) {
  return async function permissionGuard(req, res, next) {
    // 1. Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User context missing'
      });
    }

    try {
      // 2. Check for Super Admin global bypass
      if (req.user?.isSuperAdmin) {
        return next();
      }

      // 3. Resolve Dynamic Context (e.g., Club, Department, Hostel)
      let context = null;

      // Look for explicit context first
      if (req.resolvedContext) {
        context = req.resolvedContext;
      } else if (req.params?.clubId || req.body?.clubId) {
        // Fallback for legacy club context
        context = {
          type: 'club:member_service',
          id: req.params?.clubId || req.body?.clubId
        };
      } else {
        // Use registry context resolvers to dynamically lookup the context
        context = await registry.resolveContext(req);
      }

      // 4. If we have a context, check context-specific permissions
      if (context && context.type && context.id) {
        const service = registry.getService(context.type);
        if (!service) {
          console.warn(
            `[Permissions] Context service '${context.type}' not found in registry.`
          );
          return res
            .status(500)
            .json({ success: false, error: 'Internal Server Error' });
        }

        const userPerms = await service.getUserPermissions(
          req.user.id,
          context.id
        );
        const userPermsSet = new Set(userPerms);

        if (userPermsSet.has('administrator')) {
          return next();
        }

        const hasPermission = allowedPermissions.some((perm) =>
          userPermsSet.has(perm)
        );
        if (hasPermission) {
          return next();
        }
      }

      // 5. Personal Context / No Club Context
      // If no clubId is found, or if club perms didn't match, we assume they must be the owner
      // or explicitly whitelisted. Since this middleware only checks atomic permissions against roles,
      // personal resource ownership is usually checked in the controller itself.
      // So if we reach here and it's a club resource, we deny. If it's personal, they might fail here
      // unless we define a global "user" permission, or the controller handles it.
      // For now, if allowedPermissions is empty, we just pass through.
      if (allowedPermissions.length === 0) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    } catch (err) {
      console.error('Permission Guard Error:', err);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Error verifying permissions'
      });
    }
  };
}
export async function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'User context missing'
    });
  }

  try {
    if (req.user?.isSuperAdmin) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Requires Super Admin privileges'
    });
  } catch (err) {
    console.error('Super Admin Guard Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error verifying permissions'
    });
  }
}

export default requirePermissions;

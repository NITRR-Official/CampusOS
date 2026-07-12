import registry from '../utils/registry.js';
import { User } from '../database/schemas/user.schema.js';

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
      const userDoc = await User.findById(req.user.id)
        .select('isSuperAdmin')
        .lean();
      if (userDoc?.isSuperAdmin) {
        return next();
      }

      // 3. Resolve Club Context (Basic strategy for now)
      // Look for clubId in params or body
      let clubId = req.params?.clubId || req.body?.clubId;

      // Dynamically resolve context if not directly provided
      if (!clubId) {
        if (req.resolvedClubId) {
          clubId = req.resolvedClubId;
        } else {
          // Use registry context resolvers to dynamically lookup the club context
          // based on other params (e.g., eventId -> clubId)
          clubId = await registry.resolveContext(req);
        }
      }

      // 4. If we have a club context, check club-specific permissions
      if (clubId) {
        const clubService = registry.getService('clubService');
        if (!clubService) {
          console.warn(
            'ClubService not found in registry during permission check'
          );
          return res
            .status(500)
            .json({ success: false, error: 'Internal Server Error' });
        }

        const userPerms = await clubService.getUserPermissions(
          req.user.id,
          clubId
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
    const userDoc = await User.findById(req.user.id)
      .select('isSuperAdmin')
      .lean();
    console.log('SuperAdmin Check:', { userId: req.user.id, userDoc });
    if (userDoc?.isSuperAdmin) {
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

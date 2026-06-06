import { User } from '../database/schemas/user.schema.js';
import { ClubMember } from '../../../apps/club/src/schema/clubmemeber.schema.js';

// Retain validation for legacy systems if needed during migration phases
const VALID_ROLES = new Set(['admin', 'coordinator', 'volunteer']);

export function isValidRole(role) {
  return VALID_ROLES.has(role);
}

/**
 * Advanced Discord-Style Resource-Based Access Control Middleware
 * @param {string} requiredPermission - The atomic permission string required (e.g., 'event:create')
 */
export const requireRoles = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // 1. Authenticated User Context Check
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User context missing'
        });
      }

      // 2. Super Admin Bypass
      const databaseUser = await User.findById(req.user.id);
      if (databaseUser && databaseUser.isSuperAdmin === true) {
        return next();
      }

      // 3. Resolve Context (Club vs Personal)
      const clubId = req.params.clubId || req.body.clubId;

      if (!clubId) {
        // Fallback to Personal Context check (Resource Ownership)
        if (req.params.id === req.user.id || req.body.userId === req.user.id) {
          return next();
        }
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Resource context could not be determined'
        });
      }

      // 4. Fetch Club Membership and Populate Roles
      const member = await ClubMember.findOne({ 
        userId: req.user.id, 
        clubId: clubId 
      }).populate('roles');

      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You are not a member of this club'
        });
      }

      // 5. Gather Union of All Permissions
      const usersPermissionSet = new Set();
      member.roles.forEach((role) => {
        if (role && role.permissions) {
          role.permissions.forEach((perm) => usersPermissionSet.add(perm));
        }
      });

      // 6. Enforce Permission Check
      const hasGlobalAdmin = usersPermissionSet.has('administrator');
      const hasSpecificPermission = usersPermissionSet.has(requiredPermission);

      if (hasGlobalAdmin || hasSpecificPermission) {
        return next();
      }

      // 7. Insufficient Permissions Response
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Insufficient permissions. Requires: ${requiredPermission}`
      });

    } catch (error) {
      // Forward database or execution errors directly to the Express error-handler chain
      next(error);
    }
  };
};

export default requireRoles;
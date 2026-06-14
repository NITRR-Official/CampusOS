import { ClubMember } from '../../../apps/club/src/schema/clubmember.schema.js';
// Ensure Role model is imported so Mongoose knows about it during population
import '../../../apps/club/src/schema/role.schema.js';
import mongoose from 'mongoose';

/**
 * Resolves context (Club vs Personal) based on request parameters and body
 */
async function resolveResourceContext(req) {
  const { params, body, user } = req;

  // 1. Direct club ID check
  if (params.clubId) return { clubId: params.clubId };
  if (body.clubId) return { clubId: body.clubId };

  // 2. Event Context Lookup (since Event is stored in-memory in EventService)
  if (params.eventId) {
    try {
      const eventServiceModule =
        await import('../../../apps/event/src/service/event.service.js');
      const eventService = eventServiceModule.getEventService();
      if (eventService) {
        const event = eventService.getEvent(params.eventId);
        if (event) {
          if (event.clubId) {
            return { clubId: event.clubId };
          } else {
            return {
              personal: true,
              ownerId: event.createdBy,
              resource: event
            };
          }
        }
      }
    } catch (e) {
      console.error(
        '[requirePermissions] Error resolving event context:',
        e.message
      );
    }
  }

  // 3. Budget Context Lookup (from Mongoose)
  if (params.budgetId) {
    try {
      const Budget = mongoose.model('Budget');
      if (Budget) {
        const budget = await Budget.findById(params.budgetId).lean();
        if (budget && budget.clubId) {
          return { clubId: budget.clubId };
        }
      }
    } catch (e) {
      console.error(
        '[requirePermissions] Error resolving budget context:',
        e.message
      );
    }
  }

  // 4. Task Context Lookup (from Mongoose)
  if (params.taskId) {
    try {
      const Task = mongoose.model('Task');
      if (Task) {
        const task = await Task.findById(params.taskId).lean();
        if (task && task.clubId) {
          return { clubId: task.clubId };
        } else if (task) {
          return { personal: true, ownerId: task.createdBy, resource: task };
        }
      }
    } catch (e) {
      console.error(
        '[requirePermissions] Error resolving task context:',
        e.message
      );
    }
  }

  // 5. Fallback Personal Context (Resource Ownership)
  const targetUserId = params.userId || params.id || body.userId;
  if (targetUserId && targetUserId === user.id) {
    return { personal: true, ownerId: targetUserId };
  }

  return null;
}

/**
 * Advanced Discord-Style Resource-Based Access Control Middleware
 * @param {string} requiredPermission - The atomic permission string required (e.g., 'event:create')
 */
export const requirePermissions = (requiredPermission) => {
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
      if (req.user.isSuperAdmin === true) {
        return next();
      }

      // 3. Resolve Context (Club vs Personal)
      const context = await resolveResourceContext(req);

      if (!context) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Resource context could not be determined'
        });
      }

      // 4. Handle Club Context
      if (context.clubId) {
        const member = await ClubMember.findOne({
          userId: req.user.id,
          clubId: context.clubId
        }).populate('roles');

        if (!member) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'You are not a member of this club'
          });
        }

        // Gather union of all permissions from assigned Roles and Teams
        const userPermissions = new Set();
        if (member.roles) {
          member.roles.forEach((role) => {
            if (role && role.permissions) {
              role.permissions.forEach((perm) => userPermissions.add(perm));
            }
          });
        }

        // Check if user has administrator role or the specific permission
        if (
          userPermissions.has('administrator') ||
          userPermissions.has(requiredPermission)
        ) {
          return next();
        }

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Insufficient permissions. Requires: ${requiredPermission}`
        });
      }

      // 5. Handle Personal Context (Resource Ownership)
      if (context.personal) {
        const isOwner = context.ownerId === req.user.id;
        const isWhitelisted =
          context.resource &&
          context.resource.allowedUsers &&
          context.resource.allowedUsers.includes(req.user.id);

        if (isOwner || isWhitelisted) {
          return next();
        }

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message:
            'You do not own this resource and have not been granted access'
        });
      }

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Backward-Compatible requireRoles middleware
 * Checks global super admin, mapped JWT roles, or Club roles matching the name.
 */
export const requireRoles = (...allowedRoles) => {
  const allowed = new Set(allowedRoles.map((r) => r.toLowerCase()));
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User context missing'
        });
      }

      // 1. Super Admin bypass (covers 'admin')
      if (req.user.isSuperAdmin === true) {
        return next();
      }

      // 2. Mapped JWT role fallback
      if (req.user.role && allowed.has(req.user.role.toLowerCase())) {
        return next();
      }

      // 3. Club-specific roles fallback
      const clubId = req.params.clubId || req.body.clubId;
      if (clubId) {
        const member = await ClubMember.findOne({
          userId: req.user.id,
          clubId
        }).populate('roles');

        if (member && member.roles) {
          const hasMatchingRole = member.roles.some(
            (role) => role && role.name && allowed.has(role.name.toLowerCase())
          );
          if (hasMatchingRole) {
            return next();
          }
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Insufficient role. Requires one of: ${allowedRoles.join(', ')}`
      });
    } catch (error) {
      next(error);
    }
  };
};

export default requireRoles;

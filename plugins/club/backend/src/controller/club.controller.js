import { AppError } from '@campus-os/shared/errors';
import {
  addMemberSchema,
  assignRoleSchema,
  createClubSchema,
  createRoleSchema,
  updateRoleSchema
} from '../schema/club.schema.js';

export function createClubController(
  clubService,
  roleService,
  memberService,
  verificationService,
  clubRbacPolicy
) {
  async function create(req, res, next) {
    try {
      const value = createClubSchema.parse(req.body);
      const club = await clubService.createClub({
        ...value,
        createdBy: req.user?.id || 'unknown'
      });

      res.status(201).json({ success: true, data: club });
    } catch (err) {
      next(err);
    }
  }

  async function verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res
          .status(400)
          .json({ success: false, error: 'Token is required' });
      }

      await verificationService.verifyEmail(token);

      return res.status(200).json({
        success: true,
        message:
          'Email successfully verified. Club is now awaiting admin approval.'
      });
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      const status = req.query.status;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      res.status(200).json({
        success: true,
        data: await clubService.listClubs(status, { page, limit })
      });
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    const { clubId } = req.params;
    try {
      const context = await clubRbacPolicy.getContext(clubId, req.user);
      clubRbacPolicy.assertPermissions(['club:manage'], context);

      const club = await clubService.updateClub(clubId, req.body);
      res.status(200).json({ success: true, data: club });
    } catch (err) {
      if (err.code === 'PERMISSION_ESCALATION') {
        return next(new AppError(err.message, 403, err.code));
      }
      next(err);
    }
  }

  async function archive(req, res, next) {
    const { clubId } = req.params;
    try {
      const context = await clubRbacPolicy.getContext(clubId, req.user);

      if (
        !context.isClubAdmin ||
        (context.maxHierarchy < 1000 && !req.user.isSuperAdmin)
      ) {
        throw new AppError(
          'Only the club owner can archive the club',
          403,
          'OWNER_REQUIRED'
        );
      }

      const club = await clubService.archiveClub(clubId);
      res.status(200).json({ success: true, data: club });
    } catch (err) {
      next(err);
    }
  }

  async function myPermissions(req, res, next) {
    const { clubId } = req.params;
    try {
      if (!req.user) {
        return res.status(200).json({
          success: true,
          data: { permissions: [], maxHierarchy: -1, isSuperAdmin: false }
        });
      }

      const context = await clubRbacPolicy.getContext(clubId, req.user);
      const permissions = Array.from(context.permissions);

      res.status(200).json({
        success: true,
        data: {
          permissions,
          maxHierarchy: context.maxHierarchy,
          isSuperAdmin: !!req.user.isSuperAdmin,
          isMember: context.isMember || context.maxHierarchy >= 0
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async function approveClub(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.approveClub(clubId);
      if (!club) {
        return next(new AppError('Club not found', 404, 'CLUB_NOT_FOUND'));
      }
      res.status(200).json({ success: true, data: club });
    } catch (err) {
      next(err);
    }
  }

  async function rejectClub(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.rejectClub(clubId);
      if (!club) {
        return next(new AppError('Club not found', 404, 'CLUB_NOT_FOUND'));
      }
      res.status(200).json({ success: true, data: club });
    } catch (err) {
      next(err);
    }
  }

  // ==== MEMBER MANAGEMENT ====
  async function addMember(req, res, next) {
    const { clubId } = req.params;
    try {
      const value = addMemberSchema.parse(req.body);
      const assignedRole = await roleService.findRoleByName(
        clubId,
        value.role || 'volunteer'
      );

      if (assignedRole) {
        const context = await clubRbacPolicy.getContext(clubId, req.user);
        clubRbacPolicy.assertHierarchy(
          assignedRole.hierarchyLevel,
          context,
          'assign initial role to'
        );
      }

      const member = await memberService.addMember(clubId, value, assignedRole);
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  async function removeMember(req, res, next) {
    const { clubId, memberUserId } = req.params;
    try {
      const context = await clubRbacPolicy.getContext(clubId, req.user);
      const targetContext = await clubRbacPolicy.getContext(clubId, {
        id: memberUserId
      });

      clubRbacPolicy.assertHierarchy(
        targetContext.maxHierarchy,
        context,
        'remove member with'
      );

      const removed = await memberService.removeMember(clubId, memberUserId);
      if (!removed) {
        return next(new AppError('Member not found', 404, 'MEMBER_NOT_FOUND'));
      }

      res
        .status(200)
        .json({ success: true, data: { removed: true, memberUserId } });
    } catch (err) {
      next(err);
    }
  }

  async function assignRole(req, res, next) {
    const { clubId, memberUserId } = req.params;
    try {
      const value = assignRoleSchema.parse(req.body);

      const role = await roleService.findRoleByName(clubId, value.role);
      if (role) {
        const context = await clubRbacPolicy.getContext(clubId, req.user);
        clubRbacPolicy.assertHierarchy(role.hierarchyLevel, context, 'assign');
      }

      const updatedMember = await memberService.assignRole(
        clubId,
        memberUserId,
        role
      );
      if (updatedMember === undefined) {
        return next(new AppError('Member not found', 404, 'MEMBER_NOT_FOUND'));
      }

      res.status(200).json({ success: true, data: updatedMember });
    } catch (err) {
      next(err);
    }
  }

  async function revokeRole(req, res, next) {
    const { clubId, memberUserId, roleName } = req.params;
    try {
      const role = await roleService.findRoleByName(clubId, roleName);
      if (role) {
        const context = await clubRbacPolicy.getContext(clubId, req.user);
        clubRbacPolicy.assertHierarchy(role.hierarchyLevel, context, 'revoke');
      }

      const updatedMember = await memberService.removeRoleFromMember(
        clubId,
        memberUserId,
        role
      );
      if (updatedMember === undefined) {
        return next(new AppError('Member not found', 404, 'MEMBER_NOT_FOUND'));
      }

      res.status(200).json({ success: true, data: updatedMember });
    } catch (err) {
      next(err);
    }
  }

  async function listMembers(req, res, next) {
    const { clubId } = req.params;
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const members = await memberService.listMembers(clubId, { page, limit });
      res.status(200).json({ success: true, data: members });
    } catch (err) {
      next(err);
    }
  }

  // ==== ROLE MANAGEMENT ====
  async function listRoles(req, res, next) {
    const { clubId } = req.params;
    try {
      const roles = await roleService.listRoles(clubId);
      res.status(200).json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  }

  async function createRole(req, res, next) {
    const { clubId } = req.params;
    try {
      const value = createRoleSchema.parse(req.body);
      const context = await clubRbacPolicy.getContext(clubId, req.user);
      clubRbacPolicy.assertPermissions(['role:manage'], context);
      clubRbacPolicy.validatePermissionsExist(value.permissions);

      const hierarchyLevel = value.hierarchyLevel || 0;
      clubRbacPolicy.assertHierarchy(hierarchyLevel, context, 'create');
      clubRbacPolicy.assertPermissions(value.permissions, context);

      const role = await roleService.createRole(clubId, value);
      res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  async function updateRole(req, res, next) {
    const { clubId, roleId } = req.params;
    try {
      const value = updateRoleSchema.parse(req.body);
      const context = await clubRbacPolicy.getContext(clubId, req.user);
      clubRbacPolicy.assertPermissions(['role:manage'], context);
      if (value.permissions) {
        clubRbacPolicy.validatePermissionsExist(value.permissions);
      }

      const existingRole = await roleService.findRoleById(clubId, roleId);
      if (existingRole) {
        clubRbacPolicy.assertHierarchy(
          existingRole.hierarchyLevel,
          context,
          'modify'
        );
        if (value.hierarchyLevel !== undefined) {
          clubRbacPolicy.assertHierarchy(
            value.hierarchyLevel,
            context,
            'update to'
          );
        }
        if (value.permissions !== undefined) {
          const newPerms = value.permissions.filter(
            (p) => !existingRole.permissions.includes(p)
          );
          clubRbacPolicy.assertPermissions(newPerms, context);
        }
      }

      const role = await roleService.updateRole(clubId, roleId, value);
      res.status(200).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  async function deleteRole(req, res, next) {
    const { clubId, roleId } = req.params;
    try {
      const existingRole = await roleService.findRoleById(clubId, roleId);
      if (existingRole) {
        const context = await clubRbacPolicy.getContext(clubId, req.user);
        clubRbacPolicy.assertHierarchy(
          existingRole.hierarchyLevel,
          context,
          'delete'
        );
      }

      const deleted = await roleService.deleteRole(clubId, roleId);
      res.status(200).json({ success: true, data: { deleted: true, roleId } });
    } catch (err) {
      next(err);
    }
  }

  return {
    create,
    verifyEmail,
    list,
    update,
    archive,
    myPermissions,
    addMember,
    removeMember,
    assignRole,
    revokeRole,
    listMembers,
    approveClub,
    rejectClub,
    listRoles,
    createRole,
    updateRole,
    deleteRole
  };
}

export default createClubController;

import {
  validateAddMemberPayload,
  validateAssignRolePayload,
  validateCreateClubPayload,
  validateCreateRolePayload,
  validateUpdateRolePayload
} from '../schema/club.schema.js';
import { verificationService } from '../service/verification.service.js';

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

export function createClubController(clubService) {
  async function create(req, res, next) {
    const { errors, value } = validateCreateClubPayload(req.body);

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

      // In a real app we might redirect to a frontend success page.
      // For API purposes, return JSON success.
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
      res
        .status(200)
        .json({ success: true, data: await clubService.listClubs(status) });
    } catch (err) {
      next(err);
    }
  }

  async function addMember(req, res, next) {
    const { clubId } = req.params;
    const { errors, value } = validateAddMemberPayload(req.body);

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
      const member = await clubService.addMember(clubId, value);

      if (!member) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      res.status(201).json({ success: true, data: member });
    } catch (error) {
      if (error.code === 'MEMBER_EXISTS') {
        next(createHttpError(409, 'Member already exists', 'MEMBER_EXISTS'));
        return;
      }
      next(error);
    }
  }

  async function removeMember(req, res, next) {
    const { clubId, memberUserId } = req.params;
    try {
      const removed = await clubService.removeMember(
        clubId,
        memberUserId,
        req.user
      );

      if (removed === null) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      if (!removed) {
        next(createHttpError(404, 'Member not found', 'MEMBER_NOT_FOUND'));
        return;
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
    const { errors, value } = validateAssignRolePayload(req.body);

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
      const updatedMember = await clubService.assignRole(
        clubId,
        memberUserId,
        value.role,
        req.user
      );

      if (updatedMember === null) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      if (updatedMember === undefined) {
        next(createHttpError(404, 'Member not found', 'MEMBER_NOT_FOUND'));
        return;
      }

      res.status(200).json({ success: true, data: updatedMember });
    } catch (err) {
      if (err.code === 'ROLE_NOT_FOUND') {
        next(createHttpError(404, 'Role not found', 'ROLE_NOT_FOUND'));
        return;
      }
      next(err);
    }
  }

  async function approveClub(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.updateClubStatus(clubId, 'approved');

      if (!club) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      res.status(200).json({ success: true, data: club });
    } catch (err) {
      next(err);
    }
  }

  async function rejectClub(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.updateClubStatus(clubId, 'rejected');

      if (!club) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      res.status(200).json({ success: true, data: club });
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.updateClub(clubId, req.body, req.user);
      res.status(200).json({ success: true, data: club });
    } catch (err) {
      if (err.code === 'PERMISSION_ESCALATION') {
        return next(createHttpError(403, err.message, err.code));
      }
      next(err);
    }
  }

  async function archive(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.archiveClub(clubId, req.user);
      res.status(200).json({ success: true, data: club });
    } catch (err) {
      if (err.code === 'OWNER_REQUIRED') {
        return next(createHttpError(403, err.message, err.code));
      }
      next(err);
    }
  }

  async function myPermissions(req, res, next) {
    const { clubId } = req.params;
    try {
      if (!req.user) {
        return res.status(200).json({
          success: true,
          data: { permissions: [], maxHierarchy: -1, isClubAdmin: false }
        });
      }

      const userId = req.user.id || req.user._id;
      // get context directly from service which includes maxHierarchy and isClubAdmin
      // Since it's not exported, we can just use getUserPermissions
      const permissions = await clubService.getUserPermissions(userId, clubId);

      res.status(200).json({
        success: true,
        data: { permissions, isSuperAdmin: req.user.isSuperAdmin }
      });
    } catch (err) {
      next(err);
    }
  }

  // ==== ROLE MANAGEMENT ====

  async function listRoles(req, res, next) {
    const { clubId } = req.params;
    try {
      const roles = await clubService.listRoles(clubId);
      res.status(200).json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  }

  async function createRole(req, res, next) {
    const { clubId } = req.params;
    const { errors, value } = validateCreateRolePayload(req.body);

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
      const role = await clubService.createRole(clubId, value, req.user);
      res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  async function updateRole(req, res, next) {
    const { clubId, roleId } = req.params;
    const { errors, value } = validateUpdateRolePayload(req.body);

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
      const role = await clubService.updateRole(
        clubId,
        roleId,
        value,
        req.user
      );
      if (!role) {
        next(createHttpError(404, 'Role not found', 'ROLE_NOT_FOUND'));
        return;
      }
      res.status(200).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  async function deleteRole(req, res, next) {
    const { clubId, roleId } = req.params;
    try {
      const deleted = await clubService.deleteRole(clubId, roleId, req.user);
      if (!deleted) {
        next(createHttpError(404, 'Role not found', 'ROLE_NOT_FOUND'));
        return;
      }
      res.status(200).json({ success: true, data: { deleted: true, roleId } });
    } catch (err) {
      if (err.code === 'TEMPLATE_ROLE') {
        next(createHttpError(403, err.message, err.code));
        return;
      }
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
    approveClub,
    rejectClub,
    listRoles,
    createRole,
    updateRole,
    deleteRole
  };
}

export default createClubController;

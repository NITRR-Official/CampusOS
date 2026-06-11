import {
  validateAddMemberPayload,
  validateAssignRolePayload,
  validateCreateClubPayload,
  validateCreateRolePayload,
  validateAdminApprovePayload
} from '../schema/club.schema.js';
import { getClubService } from '../service/club.service.js';
import { ClubMember } from '../schema/clubmember.schema.js';

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

export function createClubController() {
  const clubService = getClubService();

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

      res.status(201).json({
        success: true,
        data: club
      });
    } catch (error) {
      next(error);
    }
  }

  async function list(req, res, next) {
    try {
      const clubs = await clubService.listClubs();
      res.status(200).json({
        success: true,
        data: clubs
      });
    } catch (error) {
      next(error);
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

      res.status(201).json({
        success: true,
        data: member
      });
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
      const removed = await clubService.removeMember(clubId, memberUserId);

      if (removed === null) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      if (!removed) {
        next(createHttpError(404, 'Member not found', 'MEMBER_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          removed: true,
          memberUserId
        }
      });
    } catch (error) {
      next(error);
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
        value.role
      );

      if (updatedMember === null) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      if (updatedMember === undefined) {
        next(createHttpError(404, 'Member not found', 'MEMBER_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedMember
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Phase 2: Role Management & Admin Approval Endpoints ---

  async function listRoles(req, res, next) {
    const { clubId } = req.params;
    try {
      const roles = await clubService.listRoles(clubId);
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
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
      // 1. Resolve user's highest role hierarchy in this club
      let userMaxHierarchy = 0;
      if (req.user?.isSuperAdmin) {
        userMaxHierarchy = Infinity;
      } else {
        const member = await ClubMember.findOne({
          userId: req.user.id,
          clubId
        }).populate('roles');

        if (!member) {
          next(
            createHttpError(
              403,
              'You are not a member of this club',
              'NOT_CLUB_MEMBER'
            )
          );
          return;
        }

        if (member.roles) {
          member.roles.forEach((r) => {
            if (r && r.hierarchyLevel > userMaxHierarchy) {
              userMaxHierarchy = r.hierarchyLevel;
            }
          });
        }
      }

      // 2. Hierarchy Check: target level must be strictly lower than user's max level
      if (value.hierarchyLevel >= userMaxHierarchy) {
        next(
          createHttpError(
            403,
            `Cannot create a role with hierarchy level ${value.hierarchyLevel} equal to or higher than your own highest role level (${userMaxHierarchy === Infinity ? 'SuperAdmin' : userMaxHierarchy})`,
            'INSUFFICIENT_HIERARCHY'
          )
        );
        return;
      }

      // 3. Save Role
      const role = await clubService.createRole(clubId, value);

      res.status(201).json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async function adminApproveClub(req, res, next) {
    // Check if user is Super Admin
    if (!req.user || req.user.isSuperAdmin !== true) {
      next(
        createHttpError(
          403,
          'Super Admin access required',
          'SUPER_ADMIN_REQUIRED'
        )
      );
      return;
    }

    const { errors, value } = validateAdminApprovePayload(req.body);
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
      if (value.action === 'approve') {
        const result = await clubService.approveClubPipeline(value.clubId);
        if (!result) {
          next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            club: result.club,
            ownerEmail: result.ownerEmail,
            ownerUsername: result.ownerUsername,
            tempPassword: result.tempPassword
          }
        });
      } else {
        const club = await clubService.rejectClubPipeline(value.clubId);
        if (!club) {
          next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
          return;
        }

        res.status(200).json({
          success: true,
          data: club
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async function approveClub(req, res, next) {
    const { clubId } = req.params;
    try {
      const result = await clubService.approveClubPipeline(clubId);

      if (!result) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          club: result.club,
          ownerEmail: result.ownerEmail,
          ownerUsername: result.ownerUsername,
          tempPassword: result.tempPassword
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async function rejectClub(req, res, next) {
    const { clubId } = req.params;
    try {
      const club = await clubService.rejectClubPipeline(clubId);

      if (!club) {
        next(createHttpError(404, 'Club not found', 'CLUB_NOT_FOUND'));
        return;
      }

      res.status(200).json({ success: true, data: club });
    } catch (error) {
      next(error);
    }
  }

  return {
    create,
    list,
    addMember,
    removeMember,
    assignRole,
    approveClub,
    rejectClub,
    listRoles,
    createRole,
    adminApproveClub
  };
}

export default createClubController;

import {
  validateAddMemberPayload,
  validateAssignRolePayload,
  validateCreateClubPayload
} from '../schema/club.schema.js';
import { getClubService } from '../service/club.service.js';

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

  function create(req, res, next) {
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

    const club = clubService.createClub({
      ...value,
      createdBy: req.user?.id || 'unknown'
    });

    res.status(201).json({
      success: true,
      data: club
    });
  }

  function list(req, res) {
    res.status(200).json({
      success: true,
      data: clubService.listClubs()
    });
  }

  function addMember(req, res, next) {
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
      const member = clubService.addMember(clubId, value);

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

  function removeMember(req, res, next) {
    const { clubId, memberUserId } = req.params;
    const removed = clubService.removeMember(clubId, memberUserId);

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
  }

  function assignRole(req, res, next) {
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

    const updatedMember = clubService.assignRole(
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
  }

  return {
    create,
    list,
    addMember,
    removeMember,
    assignRole
  };
}

export default createClubController;

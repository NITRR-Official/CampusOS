import { validateCreateInstitutePayload } from '../schema/institute.schema.js';
import { getInstituteService } from '../service/institute.service.js';

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

export function createInstituteController() {
  const instituteService = getInstituteService();

  function create(req, res, next) {
    const { errors, value } = validateCreateInstitutePayload(req.body);

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

    const institute = instituteService.createInstitute({
      ...value,
      createdBy: req.user?.id || 'unknown'
    });

    res.status(201).json({
      success: true,
      data: institute
    });
  }

  function list(req, res) {
    const institutes = instituteService.listInstitutes();

    res.status(200).json({
      success: true,
      data: institutes
    });
  }

  return {
    create,
    list
  };
}

export default createInstituteController;

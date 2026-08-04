import { createInstituteSchema } from '../schema/institute.schema.js';
import { getInstituteService } from '../service/institute.service.js';

export function createInstituteController() {
  const instituteService = getInstituteService();

  async function create(req, res, next) {
    try {
      const value = createInstituteSchema.parse(req.body);
      const institute = await instituteService.createInstitute({
        ...value,
        createdBy: req.user?.id || 'unknown'
      });

      res.status(201).json({
        success: true,
        data: institute
      });
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      const institutes = await instituteService.listInstitutes();

      res.status(200).json({
        success: true,
        data: institutes
      });
    } catch (err) {
      next(err);
    }
  }

  return {
    create,
    list
  };
}

export default createInstituteController;

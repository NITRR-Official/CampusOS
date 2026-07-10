import { Institute } from '../schema/institute.model.js';

class InstituteService {
  async createInstitute({ name, code, description, location, createdBy }) {
    const institute = new Institute({
      name,
      code: code || null,
      description: description || null,
      location: location || null,
      createdBy
    });

    await institute.save();
    return institute.toObject();
  }

  async listInstitutes() {
    return Institute.find().lean().exec();
  }
}

const instituteService = new InstituteService();

export function getInstituteService() {
  return instituteService;
}

export default getInstituteService;

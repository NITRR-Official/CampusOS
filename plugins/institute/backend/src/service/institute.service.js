import crypto from 'node:crypto';

const institutesById = new Map();

class InstituteService {
  createInstitute({ name, code, description, location, createdBy }) {
    const institute = {
      id: crypto.randomUUID(),
      name,
      code: code || null,
      description: description || null,
      location: location || null,
      createdBy,
      createdAt: new Date().toISOString()
    };

    institutesById.set(institute.id, institute);
    return institute;
  }

  listInstitutes() {
    return Array.from(institutesById.values());
  }
}

const instituteService = new InstituteService();

export function getInstituteService() {
  return instituteService;
}

export default getInstituteService;

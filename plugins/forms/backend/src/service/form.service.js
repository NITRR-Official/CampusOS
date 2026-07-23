import { AppError } from '@campus-os/shared/errors';

export function createFormService(formRepository) {
  return {
    async createForm(data) {
      return await formRepository.create(data);
    },

    async getFormById(formId) {
      const form = await formRepository.findById(formId);
      if (!form) {
        throw new AppError('Form not found', 404);
      }
      return form;
    },

    async getForms() {
      return await formRepository.findAll();
    },

    async getFormsByEntity(entityType, entityId) {
      return await formRepository.findByEntity(entityType, entityId);
    },

    async updateForm(formId, data) {
      // Note: we should add update method to formRepository
      const form = await formRepository.update(formId, data);
      if (!form) {
        throw new AppError('Form not found', 404);
      }
      return form;
    }
  };
}

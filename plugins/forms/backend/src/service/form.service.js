import { AppError } from '@campus-os/shared/errors';

export function createFormService(formRepository, eventBus) {
  return {
    async createForm(data) {
      const form = await formRepository.create(data);
      if (eventBus) {
        eventBus.emit('form:created', {
          formId: form._id,
          entityType: form.entityType,
          entityId: form.entityId
        });
      }
      return form;
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

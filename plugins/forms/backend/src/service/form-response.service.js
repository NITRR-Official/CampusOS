import { AppError } from '@campus-os/shared/errors';

export function createFormResponseService(
  formResponseRepository,
  formRepository,
  eventBus
) {
  return {
    async submitResponse(formId, userId, answers) {
      // 1. Fetch form and validate
      const form = await formRepository.findById(formId);
      if (!form) {
        throw new AppError('Form not found', 404);
      }

      if (form.status !== 'active') {
        throw new AppError(
          'This form is not currently accepting responses',
          400
        );
      }

      // 2. Validate answers against form schema
      for (const field of form.fields) {
        if (
          field.required &&
          (answers[field.name] === undefined ||
            answers[field.name] === null ||
            answers[field.name] === '')
        ) {
          throw new AppError(`Field '${field.label}' is required`, 400);
        }
      }

      // 3. Check if user already submitted
      const existing = await formResponseRepository.exists({ formId, userId });
      if (existing) {
        throw new AppError('User has already submitted this form', 400);
      }

      // 4. Convert format
      const responseMap = new Map();
      Object.entries(answers).forEach(([fieldId, value]) => {
        responseMap.set(fieldId, value);
      });

      const response = await formResponseRepository.create({
        formId,
        userId,
        answers: responseMap
      });

      // Emit event when form is successfully submitted
      if (eventBus) {
        eventBus.emit('forms:response_submitted', {
          formId,
          userId,
          responseId: response._id,
          answers: answers // send original plain object
        });
      }

      return response;
    },

    async getResponsesByFormId(formId) {
      return await formResponseRepository.findByFormId(formId);
    },

    async getResponseById(responseId) {
      const response = await formResponseRepository.findById(responseId);
      if (!response) {
        throw new AppError('Form response not found', 404);
      }
      return response;
    }
  };
}

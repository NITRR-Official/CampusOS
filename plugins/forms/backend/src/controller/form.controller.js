import { AppError } from '@campus-os/shared/errors';
import {
  createFormSchema,
  updateFormSchema,
  submitFormResponseSchema
} from '../schema/form.schema.js';

export function createFormController({
  formService,
  formResponseService,
  registry
}) {
  async function assertManagePermission(entityType, entityId, user) {
    if (user?.isSuperAdmin) return true;
    if (!user || !user.id) throw new AppError('Unauthorized', 401);

    if (entityType === 'club') {
      const clubService = registry.getService('clubService');
      if (!clubService) return false;
      const userPerms = await clubService.getUserPermissions(user.id, entityId);
      const userPermsSet = new Set(userPerms);
      if (
        userPermsSet.has('administrator') ||
        userPermsSet.has('forms:manage')
      ) {
        return true;
      }
    }
    throw new AppError(
      'Forbidden: Insufficient permissions for this entity',
      403
    );
  }

  return {
    async createForm(req, res, next) {
      try {
        const validatedData = createFormSchema.parse(req.body);
        await assertManagePermission(
          validatedData.entityType,
          validatedData.entityId,
          req.user
        );

        const form = await formService.createForm(validatedData);
        res.status(201).json({ success: true, data: form });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    },

    async getForm(req, res, next) {
      try {
        const form = await formService.getFormById(req.params.formId);
        res.status(200).json({ success: true, data: form });
      } catch (error) {
        next(error);
      }
    },

    async updateForm(req, res, next) {
      try {
        const validatedData = updateFormSchema.parse(req.body);
        const existingForm = await formService.getFormById(req.params.formId);
        await assertManagePermission(
          existingForm.entityType,
          existingForm.entityId,
          req.user
        );

        const form = await formService.updateForm(
          req.params.formId,
          validatedData
        );
        res.status(200).json({ success: true, data: form });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    },

    async getForms(req, res, next) {
      try {
        const { entityType, entityId } = req.query;
        if (!entityType || !entityId) {
          throw new AppError(
            'entityType and entityId are required query parameters',
            400
          );
        }

        // Let anyone view forms for an entity if they are active, or require manage permission to view drafts
        // For simplicity, we just fetch them. View permission is usually public or member-based.
        const forms = await formService.getFormsByEntity(entityType, entityId);
        res
          .status(200)
          .json({ success: true, count: forms.length, data: forms });
      } catch (error) {
        next(error);
      }
    },

    async submitResponse(req, res, next) {
      try {
        const validatedData = submitFormResponseSchema.parse(req.body);
        const userId = req.user?.id; // Assuming auth middleware sets req.user
        if (!userId) {
          throw new AppError(
            'Authentication required to submit form response',
            401
          );
        }

        const response = await formResponseService.submitResponse(
          req.params.formId,
          userId,
          validatedData
        );
        res.status(201).json({ success: true, data: response });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    },

    async getResponses(req, res, next) {
      try {
        const existingForm = await formService.getFormById(req.params.formId);
        await assertManagePermission(
          existingForm.entityType,
          existingForm.entityId,
          req.user
        );

        const responses = await formResponseService.getResponsesByFormId(
          req.params.formId
        );
        res
          .status(200)
          .json({ success: true, count: responses.length, data: responses });
      } catch (error) {
        next(error);
      }
    },

    async getResponse(req, res, next) {
      try {
        const response = await formResponseService.getResponseById(
          req.params.responseId
        );
        // Security: verify it belongs to the formId in params
        if (response.formId.toString() !== req.params.formId) {
          throw new AppError('Response does not belong to this form', 400);
        }
        res.status(200).json({ success: true, data: response });
      } catch (error) {
        next(error);
      }
    }
  };
}

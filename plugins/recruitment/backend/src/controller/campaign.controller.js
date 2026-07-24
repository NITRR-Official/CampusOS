import { AppError } from '@campus-os/shared/errors';
import {
  createCampaignSchema,
  updateCampaignSchema
} from '../schema/recruitment.schema.js';

export function createCampaignController({ campaignService, registry }) {
  const assertManagePermission = async (entityType, entityId, user) => {
    const policy = registry.getService(`${entityType}RbacPolicy`);
    if (policy) {
      const context = await policy.getContext(entityId, user);
      policy.assertPermissions(['recruitment:manage'], context);
    }
  };

  return {
    async createCampaign(req, res, next) {
      try {
        const validatedData = createCampaignSchema.parse(req.body);
        await assertManagePermission(
          validatedData.entityType,
          validatedData.entityId,
          req.user
        );

        const campaign = await campaignService.createCampaign(validatedData);
        res.status(201).json({ success: true, data: campaign });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    },

    async getCampaign(req, res, next) {
      try {
        const campaign = await campaignService.getCampaignById(
          req.params.campaignId
        );
        res.status(200).json({ success: true, data: campaign });
      } catch (error) {
        next(error);
      }
    },

    async getCampaigns(req, res, next) {
      try {
        const { entityType, entityId } = req.query;
        if (!entityType || !entityId) {
          throw new AppError(
            'entityType and entityId are required query parameters',
            400
          );
        }
        const campaigns = await campaignService.getCampaignsByEntity(
          entityType,
          entityId
        );
        res
          .status(200)
          .json({ success: true, count: campaigns.length, data: campaigns });
      } catch (error) {
        next(error);
      }
    },

    async updateCampaign(req, res, next) {
      try {
        const validatedData = updateCampaignSchema.parse(req.body);

        // Fetch campaign to know its entityType/entityId
        const existingCampaign = await campaignService.getCampaignById(
          req.params.campaignId
        );
        await assertManagePermission(
          existingCampaign.entityType,
          existingCampaign.entityId,
          req.user
        );

        const campaign = await campaignService.updateCampaign(
          req.params.campaignId,
          validatedData
        );
        res.status(200).json({ success: true, data: campaign });
      } catch (error) {
        if (error.name === 'ZodError') {
          return next(new AppError('Validation failed', 400, error.errors));
        }
        next(error);
      }
    }
  };
}

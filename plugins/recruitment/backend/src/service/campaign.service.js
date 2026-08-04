import { AppError } from '@campus-os/shared/errors';

export function createCampaignService(campaignRepository, eventBus) {
  return {
    async createCampaign(data) {
      const campaign = await campaignRepository.create(data);
      if (eventBus) {
        eventBus.emit('campaign:created', {
          campaignId: campaign._id,
          entityType: campaign.entityType,
          entityId: campaign.entityId
        });
      }
      return campaign;
    },

    async getCampaignById(campaignId) {
      const campaign = await campaignRepository.findById(campaignId);
      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }
      return campaign;
    },

    async getCampaignsByEntity(entityType, entityId) {
      return await campaignRepository.findByEntity(entityType, entityId);
    },

    async getCampaignByFormId(formId, status) {
      return await campaignRepository.findByFormId(formId, status);
    },

    async updateCampaign(campaignId, data) {
      const campaign = await campaignRepository.update(campaignId, data);
      if (!campaign) {
        throw new AppError('Campaign not found', 404);
      }
      return campaign;
    }
  };
}

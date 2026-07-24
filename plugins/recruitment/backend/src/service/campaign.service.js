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
      // Need to add this to the repository if missing, but it's basically a find
      // Wait, earlier I didn't add findByEntity to campaign.repository.js! I should just add it.
      // Or I can use find({ entityType, entityId }) if the repository supports it.
      // I will update the repository in a sec.
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

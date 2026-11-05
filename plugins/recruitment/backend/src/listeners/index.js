import { registerFormsListener } from './forms.listener.js';

export function registerEventHandlers(eventBus, services) {
  const { campaignService, candidateService } = services;
  registerFormsListener(eventBus, services);

  eventBus.on('club:deleted', async (payload) => {
    try {
      if (payload && payload.clubId && campaignService && candidateService) {
        const campaigns = await campaignService.getCampaignsByEntity(
          'club',
          payload.clubId
        );
        const campaignIds = campaigns.map((c) => c._id || c.id);
        if (campaignIds.length > 0) {
          await candidateService.deleteCandidatesByCampaignIds(campaignIds);
          await campaignService.deleteCampaignsByEntity('club', payload.clubId);
        }
      }
    } catch (err) {
      console.error(
        '[Recruitment Listener] Error handling club:deleted event:',
        err
      );
    }
  });

  eventBus.on('user:deleted', async (payload) => {
    try {
      if (payload && payload.userId && candidateService) {
        await candidateService.deleteCandidatesByUserId(payload.userId);
      }
    } catch (err) {
      console.error(
        '[Recruitment Listener] Error handling user:deleted event:',
        err
      );
    }
  });
}

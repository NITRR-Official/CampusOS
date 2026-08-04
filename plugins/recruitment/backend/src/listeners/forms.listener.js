export function registerFormsListener(
  eventBus,
  { candidateService, campaignService }
) {
  eventBus.on('forms:response_submitted', async (payload) => {
    try {
      const { formId, userId, responseId } = payload;

      // Check if this form is linked to an active recruitment campaign
      const campaign = await campaignService.getCampaignByFormId(
        formId,
        'active'
      );

      if (!campaign) {
        // Not a recruitment form, or campaign is closed/draft. Do nothing.
        return;
      }

      // Create a candidate representing this application
      await candidateService.createCandidate({
        campaignId: campaign._id,
        userId,
        responseId,
        status: 'applied'
      });

      console.log(
        `[Recruitment] Candidate created for user ${userId} in campaign ${campaign._id}`
      );
    } catch (err) {
      console.error(
        '[Recruitment] Error in forms:response_submitted listener:',
        err
      );
    }
  });
}

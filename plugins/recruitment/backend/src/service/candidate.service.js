import { AppError } from '@campus-os/shared/errors';

export function createCandidateService(
  candidateRepository,
  campaignRepository,
  eventBus
) {
  return {
    async createCandidate(data) {
      return await candidateRepository.create(data);
    },

    async getCandidatesByCampaign(campaignId) {
      return await candidateRepository.findByCampaignId(campaignId);
    },

    async getCandidateById(candidateId) {
      const candidate = await candidateRepository.findById(candidateId);
      if (!candidate) {
        throw new AppError('Candidate not found', 404);
      }
      return candidate;
    },

    async updateCandidateStatus(candidateId, status) {
      const candidate = await candidateRepository.updateStatus(
        candidateId,
        status
      );
      if (!candidate) {
        throw new AppError('Candidate not found', 404);
      }

      // Emit event if selected, so club module can add member
      if (status === 'selected' && eventBus) {
        const campaign = await campaignRepository.findById(
          candidate.campaignId
        );
        if (campaign) {
          eventBus.emit('recruitment:candidate_selected', {
            entityType: campaign.entityType,
            entityId: campaign.entityId,
            userId: candidate.userId,
            campaignId: campaign._id,
            onboardRoleName: campaign.onboardRoleName || 'volunteer'
          });
        }
      }

      return candidate;
    },

    async updateCandidateNotes(candidateId, notes) {
      const candidate = await candidateRepository.updateNotes(
        candidateId,
        notes
      );
      if (!candidate) {
        throw new AppError('Candidate not found', 404);
      }
      return candidate;
    }
  };
}

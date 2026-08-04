import { Router } from 'express';

export function registerRecruitmentRoutes(
  app,
  campaignController,
  candidateController,
  requirePermissions
) {
  const router = Router();

  const viewRecruitment = requirePermissions('recruitment:view');
  const manageRecruitment = requirePermissions('recruitment:manage');

  // Campaign Routes
  router.get('/campaigns', viewRecruitment, campaignController.getCampaigns);
  router.post(
    '/campaigns',
    manageRecruitment,
    campaignController.createCampaign
  );

  router.get(
    '/campaigns/:campaignId',
    viewRecruitment,
    campaignController.getCampaign
  );
  router.put(
    '/campaigns/:campaignId',
    manageRecruitment,
    campaignController.updateCampaign
  );

  // Candidate Routes (Nested under campaigns)
  router.get(
    '/campaigns/:campaignId/candidates',
    manageRecruitment,
    candidateController.getCandidates
  );
  router.get(
    '/campaigns/:campaignId/candidates/:candidateId',
    manageRecruitment,
    candidateController.getCandidate
  );

  router.patch(
    '/campaigns/:campaignId/candidates/:candidateId/status',
    manageRecruitment,
    candidateController.updateStatus
  );
  router.patch(
    '/campaigns/:campaignId/candidates/:candidateId/notes',
    manageRecruitment,
    candidateController.updateNotes
  );

  app.use('/api/v1/recruitment', router);
}

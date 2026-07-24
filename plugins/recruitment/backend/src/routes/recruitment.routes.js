import { Router } from 'express';

export function registerRecruitmentRoutes(
  app,
  campaignController,
  candidateController,
  requirePermissions
) {
  const router = Router();

  // Campaign Routes
  router.get(
    '/campaigns',
    requirePermissions(),
    campaignController.getCampaigns
  );
  router.post(
    '/campaigns',
    requirePermissions(),
    campaignController.createCampaign
  );

  router.get(
    '/campaigns/:campaignId',
    requirePermissions(),
    campaignController.getCampaign
  );
  router.put(
    '/campaigns/:campaignId',
    requirePermissions(),
    campaignController.updateCampaign
  );

  // Candidate Routes (Nested under campaigns)
  router.get(
    '/campaigns/:campaignId/candidates',
    requirePermissions(),
    candidateController.getCandidates
  );
  router.get(
    '/campaigns/:campaignId/candidates/:candidateId',
    requirePermissions(),
    candidateController.getCandidate
  );

  router.patch(
    '/campaigns/:campaignId/candidates/:candidateId/status',
    requirePermissions(),
    candidateController.updateStatus
  );
  router.patch(
    '/campaigns/:campaignId/candidates/:candidateId/notes',
    requirePermissions(),
    candidateController.updateNotes
  );

  app.use('/api/v1/recruitment', router);
}

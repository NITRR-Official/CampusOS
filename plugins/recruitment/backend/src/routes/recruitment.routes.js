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
    requirePermissions('recruitment:view'),
    campaignController.getCampaigns
  );
  router.post(
    '/campaigns',
    requirePermissions('recruitment:manage'),
    campaignController.createCampaign
  );

  router.get(
    '/campaigns/:campaignId',
    requirePermissions('recruitment:view'),
    campaignController.getCampaign
  );
  router.put(
    '/campaigns/:campaignId',
    requirePermissions('recruitment:manage'),
    campaignController.updateCampaign
  );

  // Candidate Routes (Nested under campaigns)
  router.get(
    '/campaigns/:campaignId/candidates',
    requirePermissions('recruitment:manage'),
    candidateController.getCandidates
  );
  router.get(
    '/campaigns/:campaignId/candidates/:candidateId',
    requirePermissions('recruitment:manage'),
    candidateController.getCandidate
  );

  router.patch(
    '/campaigns/:campaignId/candidates/:candidateId/status',
    requirePermissions('recruitment:manage'),
    candidateController.updateStatus
  );
  router.patch(
    '/campaigns/:campaignId/candidates/:candidateId/notes',
    requirePermissions('recruitment:manage'),
    candidateController.updateNotes
  );

  app.use('/api/v1/recruitment', router);
}

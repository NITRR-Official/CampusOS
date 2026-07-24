import { createCampaignService } from './service/campaign.service.js';
import { createCandidateService } from './service/candidate.service.js';
import { createCampaignRepository } from './repository/campaign.repository.js';
import { createCandidateRepository } from './repository/candidate.repository.js';
import { CampaignModel } from './schema/campaign.model.js';
import { CandidateModel } from './schema/candidate.model.js';
import { createCampaignController } from './controller/campaign.controller.js';
import { createCandidateController } from './controller/candidate.controller.js';
import { registerRecruitmentRoutes } from './routes/recruitment.routes.js';
import { registerEventHandlers } from './listeners/index.js';

export function init(app, registry, eventBus) {
  // 1. Get EventBus and Middlewares
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error(
      'Permission middleware service (requirePermissions) is not configured'
    );
  }

  // Register Permissions
  if (registry.permissions) {
    registry.permissions.register({
      id: 'recruitment:manage',
      name: 'Manage Recruitment',
      description:
        'Create and edit recruitment campaigns, and manage candidates.',
      module: 'recruitment'
    });
    registry.permissions.register({
      id: 'recruitment:view',
      name: 'View Recruitment',
      description: 'View recruitment campaigns.',
      module: 'recruitment'
    });
  }

  // 2. Instantiate Repositories
  const campaignRepository = createCampaignRepository(CampaignModel);
  const candidateRepository = createCandidateRepository(CandidateModel);

  // 3. Instantiate Services
  const campaignService = createCampaignService(campaignRepository, eventBus);
  const candidateService = createCandidateService(
    candidateRepository,
    campaignRepository,
    eventBus
  );

  // 4. Instantiate Controllers
  const campaignController = createCampaignController({
    campaignService,
    registry
  });
  const candidateController = createCandidateController({
    candidateService,
    registry,
    campaignService
  });

  // 4. Register Routes
  registerRecruitmentRoutes(
    app,
    campaignController,
    candidateController,
    requirePermissions
  );

  // 5. Register Event Listeners
  if (eventBus) {
    registerEventHandlers(eventBus, { candidateService, campaignService });
  }

  // 6. Register Services to the Registry
  registry.registerService('recruitment:campaign-service', campaignService);
  registry.registerService('recruitment:candidate-service', candidateService);

  // 6. Register Module for discoverability
  registry.registerModule('recruitment', {
    routes: [
      'GET /api/v1/recruitment/campaigns',
      'POST /api/v1/recruitment/campaigns',
      'GET /api/v1/recruitment/campaigns/:campaignId',
      'PUT /api/v1/recruitment/campaigns/:campaignId',
      'GET /api/v1/recruitment/campaigns/:campaignId/candidates',
      'GET /api/v1/recruitment/campaigns/:campaignId/candidates/:candidateId',
      'PATCH /api/v1/recruitment/campaigns/:campaignId/candidates/:candidateId/status',
      'PATCH /api/v1/recruitment/campaigns/:campaignId/candidates/:candidateId/notes'
    ]
  });

  console.log('✓ Loaded plugin: recruitment');
}

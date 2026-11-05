import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { CampaignModel } from '../schema/campaign.model.js';
import { CandidateModel } from '../schema/candidate.model.js';
import { createCampaignService } from '../service/campaign.service.js';
import { createCandidateService } from '../service/candidate.service.js';
import { createCampaignRepository } from '../repository/campaign.repository.js';
import { createCandidateRepository } from '../repository/candidate.repository.js';
import { registerEventHandlers } from './index.js';

describe('Recruitment Listeners (Integration)', () => {
  let mongoServer;
  let campaignService;
  let candidateService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    eventBus = new EventEmitter();
    const campaignRepo = createCampaignRepository(CampaignModel);
    const candidateRepo = createCandidateRepository(CandidateModel);

    campaignService = createCampaignService(campaignRepo, eventBus);
    candidateService = createCandidateService(
      candidateRepo,
      campaignRepo,
      eventBus
    );

    registerEventHandlers(eventBus, { campaignService, candidateService });
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await CampaignModel.deleteMany({});
    await CandidateModel.deleteMany({});
  });

  describe('club:deleted listener', () => {
    it('should delete all campaigns and candidates associated with the deleted club', async () => {
      const clubId = 'club-recruitment-delete';
      const formId = new mongoose.Types.ObjectId();
      const responseId1 = new mongoose.Types.ObjectId();
      const responseId2 = new mongoose.Types.ObjectId();

      const campaign1 = await campaignService.createCampaign({
        title: 'Core Team Recruitment',
        entityType: 'club',
        entityId: clubId,
        formId
      });

      const campaign2 = await campaignService.createCampaign({
        title: 'Volunteer Recruitment',
        entityType: 'club',
        entityId: clubId,
        formId
      });

      const otherCampaign = await campaignService.createCampaign({
        title: 'Other Club Drive',
        entityType: 'club',
        entityId: 'other-club',
        formId
      });

      await candidateService.createCandidate({
        campaignId: campaign1._id,
        userId: 'candidate-1',
        responseId: responseId1
      });

      await candidateService.createCandidate({
        campaignId: campaign2._id,
        userId: 'candidate-2',
        responseId: responseId2
      });

      const campsBefore = await CampaignModel.find({
        entityType: 'club',
        entityId: clubId
      });
      expect(campsBefore.length).toBe(2);

      const candsBefore = await CandidateModel.find({
        campaignId: { $in: [campaign1._id, campaign2._id] }
      });
      expect(candsBefore.length).toBe(2);

      eventBus.emit('club:deleted', { clubId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const campsAfter = await CampaignModel.find({
        entityType: 'club',
        entityId: clubId
      });
      expect(campsAfter.length).toBe(0);

      const candsAfter = await CandidateModel.find({
        campaignId: { $in: [campaign1._id, campaign2._id] }
      });
      expect(candsAfter.length).toBe(0);

      const otherCamps = await CampaignModel.find({ entityId: 'other-club' });
      expect(otherCamps.length).toBe(1);
    });
  });

  describe('user:deleted listener', () => {
    it('should delete all candidates for the deleted user', async () => {
      const formId = new mongoose.Types.ObjectId();
      const responseId = new mongoose.Types.ObjectId();

      const campaign = await campaignService.createCampaign({
        title: 'Drive',
        entityType: 'club',
        entityId: 'club-drive',
        formId
      });

      await candidateService.createCandidate({
        campaignId: campaign._id,
        userId: 'user-to-delete-recruit',
        responseId
      });

      await candidateService.createCandidate({
        campaignId: campaign._id,
        userId: 'user-keep-recruit',
        responseId
      });

      const candsBefore = await CandidateModel.find({
        campaignId: campaign._id
      });
      expect(candsBefore.length).toBe(2);

      eventBus.emit('user:deleted', { userId: 'user-to-delete-recruit' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const candsAfter = await CandidateModel.find({
        campaignId: campaign._id
      });
      expect(candsAfter.length).toBe(1);
      expect(candsAfter[0].userId).toBe('user-keep-recruit');
    });
  });
});

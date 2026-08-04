import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { CandidateModel } from '../schema/candidate.model.js';
import { CampaignModel } from '../schema/campaign.model.js';
import { createCandidateRepository } from '../repository/candidate.repository.js';
import { createCampaignRepository } from '../repository/campaign.repository.js';
import { createCandidateService } from './candidate.service.js';

describe('CandidateService', () => {
  let service;
  let mongoServer;
  let mockEventBus;
  let candidateRepository;
  let campaignRepository;
  let testCampaignId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await CandidateModel.deleteMany({});
    await CampaignModel.deleteMany({});

    candidateRepository = createCandidateRepository(CandidateModel);
    campaignRepository = createCampaignRepository(CampaignModel);

    mockEventBus = {
      emit: () => {}
    };

    service = createCandidateService(
      candidateRepository,
      campaignRepository,
      mockEventBus
    );

    // Create a base campaign to test candidates against
    const campaign = await CampaignModel.create({
      title: 'Volunteer Recruitment',
      entityType: 'club',
      entityId: 'club-1',
      formId: new mongoose.Types.ObjectId().toString(),
      status: 'active',
      onboardRoleName: 'member'
    });
    testCampaignId = campaign._id.toString();
  });

  describe('createCandidate', () => {
    it('should create a new candidate', async () => {
      const candidateData = {
        campaignId: testCampaignId,
        userId: 'user-1',
        responseId: new mongoose.Types.ObjectId().toString()
      };

      const result = await service.createCandidate(candidateData);

      expect(result).toBeDefined();
      expect(result.campaignId.toString()).toBe(testCampaignId);
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe('applied');
    });
  });

  describe('getCandidatesByCampaign', () => {
    it('should return candidates for a given campaign', async () => {
      await service.createCandidate({
        campaignId: testCampaignId,
        userId: 'user-1',
        responseId: new mongoose.Types.ObjectId().toString()
      });
      await service.createCandidate({
        campaignId: testCampaignId,
        userId: 'user-2',
        responseId: new mongoose.Types.ObjectId().toString()
      });

      const candidates = await service.getCandidatesByCampaign(testCampaignId);
      expect(candidates.length).toBe(2);
    });
  });

  describe('getCandidateById', () => {
    it('should return a candidate by id', async () => {
      const candidate = await service.createCandidate({
        campaignId: testCampaignId,
        userId: 'user-1',
        responseId: new mongoose.Types.ObjectId().toString()
      });

      const result = await service.getCandidateById(candidate._id.toString());
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-1');
    });

    it('should throw AppError if candidate not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(service.getCandidateById(fakeId)).rejects.toThrow(
        'Candidate not found'
      );
    });
  });

  describe('updateCandidateStatus', () => {
    it('should update candidate status', async () => {
      const candidate = await service.createCandidate({
        campaignId: testCampaignId,
        userId: 'user-1',
        responseId: new mongoose.Types.ObjectId().toString()
      });

      const updated = await service.updateCandidateStatus(
        candidate._id.toString(),
        'shortlisted'
      );

      expect(updated).toBeDefined();
      expect(updated.status).toBe('shortlisted');
    });

    it('should emit recruitment:candidate_selected when status becomes selected', async () => {
      const candidate = await service.createCandidate({
        campaignId: testCampaignId,
        userId: 'user-1',
        responseId: new mongoose.Types.ObjectId().toString()
      });

      let emittedEvent = null;
      mockEventBus.emit = (eventName, payload) => {
        emittedEvent = { eventName, payload };
      };

      await service.updateCandidateStatus(candidate._id.toString(), 'selected');

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.eventName).toBe('recruitment:candidate_selected');
      expect(emittedEvent.payload.userId).toBe('user-1');
      expect(emittedEvent.payload.entityType).toBe('club');
      expect(emittedEvent.payload.onboardRoleName).toBe('member');
    });

    it('should throw AppError if candidate not found on status update', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        service.updateCandidateStatus(fakeId, 'selected')
      ).rejects.toThrow('Candidate not found');
    });
  });

  describe('updateCandidateNotes', () => {
    it('should update candidate notes', async () => {
      const candidate = await service.createCandidate({
        campaignId: testCampaignId,
        userId: 'user-1',
        responseId: new mongoose.Types.ObjectId().toString()
      });

      const updated = await service.updateCandidateNotes(
        candidate._id.toString(),
        'Strong technical skills'
      );

      expect(updated).toBeDefined();
      expect(updated.notes).toBe('Strong technical skills');
    });

    it('should throw AppError if candidate not found on notes update', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        service.updateCandidateNotes(fakeId, 'Note')
      ).rejects.toThrow('Candidate not found');
    });
  });
});

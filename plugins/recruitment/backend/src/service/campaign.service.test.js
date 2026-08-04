import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { CampaignModel } from '../schema/campaign.model.js';
import { createCampaignRepository } from '../repository/campaign.repository.js';
import { createCampaignService } from './campaign.service.js';

describe('CampaignService', () => {
  let service;
  let mongoServer;
  let mockEventBus;
  let campaignRepository;

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
    await CampaignModel.deleteMany({});

    campaignRepository = createCampaignRepository(CampaignModel);

    mockEventBus = {
      emit: () => {}
    };

    service = createCampaignService(campaignRepository, mockEventBus);
  });

  describe('createCampaign', () => {
    it('should create a new campaign and emit event', async () => {
      const campaignData = {
        title: 'Fall 2026 Recruitment',
        description: 'Recruiting for developers',
        entityType: 'club',
        entityId: new mongoose.Types.ObjectId().toString(),
        formId: new mongoose.Types.ObjectId().toString()
      };

      let emittedEvent = null;
      mockEventBus.emit = (eventName, payload) => {
        emittedEvent = { eventName, payload };
      };

      const result = await service.createCampaign(campaignData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Fall 2026 Recruitment');
      expect(result.status).toBe('draft');
      expect(result.onboardRoleName).toBe('volunteer');

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.eventName).toBe('campaign:created');
      expect(emittedEvent.payload.campaignId.toString()).toBe(
        result._id.toString()
      );
    });
  });

  describe('getCampaignById', () => {
    it('should return a campaign by id', async () => {
      const campaign = await CampaignModel.create({
        title: 'Spring Fest volunteers',
        entityType: 'event',
        entityId: new mongoose.Types.ObjectId().toString(),
        formId: new mongoose.Types.ObjectId().toString()
      });

      const result = await service.getCampaignById(campaign._id.toString());
      expect(result).toBeDefined();
      expect(result.title).toBe('Spring Fest volunteers');
    });

    it('should throw AppError if campaign not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(service.getCampaignById(fakeId)).rejects.toThrow(
        'Campaign not found'
      );
    });
  });

  describe('getCampaignsByEntity', () => {
    it('should return campaigns for a specific entity', async () => {
      const clubId = new mongoose.Types.ObjectId().toString();

      await CampaignModel.create([
        {
          title: 'C1',
          entityType: 'club',
          entityId: clubId,
          formId: new mongoose.Types.ObjectId().toString()
        },
        {
          title: 'C2',
          entityType: 'event',
          entityId: 'event-1',
          formId: new mongoose.Types.ObjectId().toString()
        }
      ]);

      const results = await service.getCampaignsByEntity('club', clubId);
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('C1');
    });
  });

  describe('getCampaignByFormId', () => {
    it('should return a campaign associated with a form', async () => {
      const formId = new mongoose.Types.ObjectId().toString();

      await CampaignModel.create({
        title: 'Form Campaign',
        entityType: 'club',
        entityId: 'club-1',
        formId,
        status: 'active'
      });

      const result = await service.getCampaignByFormId(formId, 'active');
      expect(result).toBeDefined();
      expect(result.title).toBe('Form Campaign');
    });
  });

  describe('updateCampaign', () => {
    it('should update an existing campaign', async () => {
      const campaign = await CampaignModel.create({
        title: 'Draft Campaign',
        entityType: 'club',
        entityId: 'club-1',
        formId: new mongoose.Types.ObjectId().toString(),
        status: 'draft'
      });

      const updated = await service.updateCampaign(campaign._id.toString(), {
        status: 'active',
        onboardRoleName: 'member'
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe('active');
      expect(updated.onboardRoleName).toBe('member');
    });

    it('should throw AppError if campaign not found on update', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        service.updateCampaign(fakeId, { title: 'New' })
      ).rejects.toThrow('Campaign not found');
    });
  });
});

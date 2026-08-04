import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ActivityLog } from '../schema/activity.model.js';
import { createActivityService } from './activity.service.js';

describe('ActivityService', () => {
  let service;
  let mongoServer;
  let mockRegistry;

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
    await ActivityLog.deleteMany({});

    mockRegistry = {
      getPluginMetadata: (entityType) => {
        if (entityType === 'club') {
          return { themeColor: 'bg-blue-500 text-white' };
        }
        return null;
      }
    };

    service = createActivityService(mockRegistry);
  });

  describe('logActivity', () => {
    it('should create a new activity log', async () => {
      const payload = {
        actorId: new mongoose.Types.ObjectId().toString(),
        action: 'CREATED_EVENT',
        entityId: new mongoose.Types.ObjectId().toString(),
        entityType: 'event',
        metadata: { title: 'Hackathon' }
      };

      const result = await service.logActivity(payload);

      expect(result).toBeDefined();
      expect(result.action).toBe('CREATED_EVENT');
      expect(result.entityType).toBe('event');
      expect(result.metadata.title).toBe('Hackathon');
    });
  });

  describe('getGlobalFeed', () => {
    it('should return paginated global feed with injected theme colors', async () => {
      await ActivityLog.create([
        { action: 'UPDATE', entityType: 'club' },
        { action: 'DELETE', entityType: 'event' }
      ]);

      const feed = await service.getGlobalFeed({ limit: 10, skip: 0 });
      expect(feed.length).toBe(2);

      // Since it's sorted by createdAt -1, the last one created is first.
      // But let's just check the theme colors.
      const clubLog = feed.find((l) => l.entityType === 'club');
      expect(clubLog.themeColor).toBe('bg-blue-500 text-white');

      const eventLog = feed.find((l) => l.entityType === 'event');
      expect(eventLog.themeColor).toContain('bg-gray-100'); // Default fallback
    });
  });

  describe('getEntityFeed', () => {
    it('should return feed for a specific entity', async () => {
      const entityId = new mongoose.Types.ObjectId().toString();

      await ActivityLog.create([
        { action: 'ACTION_1', entityId },
        {
          action: 'ACTION_2',
          entityId: new mongoose.Types.ObjectId().toString()
        }
      ]);

      const feed = await service.getEntityFeed(entityId, {
        limit: 10,
        skip: 0
      });
      expect(feed.length).toBe(1);
      expect(feed[0].action).toBe('ACTION_1');
    });
  });

  describe('getUserFeed', () => {
    it('should return feed for a specific actor', async () => {
      const actorId = new mongoose.Types.ObjectId().toString();

      await ActivityLog.create([
        { action: 'USER_ACTION_1', actorId },
        {
          action: 'USER_ACTION_2',
          actorId: new mongoose.Types.ObjectId().toString()
        }
      ]);

      const feed = await service.getUserFeed(actorId, { limit: 10, skip: 0 });
      expect(feed.length).toBe(1);
      expect(feed[0].action).toBe('USER_ACTION_1');
    });
  });
});

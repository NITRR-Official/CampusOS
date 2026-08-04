import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { FormModel } from '../schema/form.model.js';
import { FormResponseModel } from '../schema/form-response.model.js';
import { createFormRepository } from '../repository/form.repository.js';
import { createFormResponseRepository } from '../repository/form-response.repository.js';
import { createFormResponseService } from './form-response.service.js';

describe('FormResponseService', () => {
  let service;
  let mongoServer;
  let mockEventBus;
  let formRepository;
  let testFormId;

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
    await FormModel.deleteMany({});
    await FormResponseModel.deleteMany({});

    formRepository = createFormRepository(FormModel);
    const formResponseRepository =
      createFormResponseRepository(FormResponseModel);

    mockEventBus = {
      emit: () => {}
    };

    service = createFormResponseService(
      formResponseRepository,
      formRepository,
      mockEventBus
    );

    // Create a base active form to test responses against
    const form = await FormModel.create({
      title: 'Survey',
      entityType: 'event',
      entityId: 'e1',
      status: 'active',
      fields: [
        { id: 'f1', label: 'Age', type: 'number', required: true },
        { id: 'f2', label: 'Comments', type: 'text', required: false }
      ]
    });
    testFormId = form._id.toString();
  });

  describe('submitResponse', () => {
    it('should submit a valid response and emit event', async () => {
      let emittedEvent = null;
      mockEventBus.emit = (eventName, payload) => {
        emittedEvent = { eventName, payload };
      };

      const result = await service.submitResponse(testFormId, 'user-1', {
        f1: 25,
        f2: 'Great event!'
      });

      expect(result).toBeDefined();
      expect(result.formId.toString()).toBe(testFormId);
      expect(result.userId).toBe('user-1');
      expect(result.answers.get('f1')).toBe(25);

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.eventName).toBe('forms:response_submitted');
      expect(emittedEvent.payload.userId).toBe('user-1');
      expect(emittedEvent.payload.answers.f1).toBe(25);
    });

    it('should throw AppError if form does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        service.submitResponse(fakeId, 'user-1', {})
      ).rejects.toThrow('Form not found');
    });

    it('should throw AppError if form is not active', async () => {
      const inactiveForm = await FormModel.create({
        title: 'Draft Survey',
        entityType: 'event',
        entityId: 'e2',
        status: 'draft',
        fields: []
      });

      await expect(
        service.submitResponse(inactiveForm._id.toString(), 'user-1', {})
      ).rejects.toThrow('This form is not currently accepting responses');
    });

    it('should throw AppError if required fields are missing', async () => {
      // f1 is required, only providing f2
      await expect(
        service.submitResponse(testFormId, 'user-1', { f2: 'Hello' })
      ).rejects.toThrow("Field 'Age' is required");
    });

    it('should throw AppError if user submits twice', async () => {
      // First submission
      await service.submitResponse(testFormId, 'user-1', { f1: 30 });

      // Second submission
      await expect(
        service.submitResponse(testFormId, 'user-1', { f1: 30 })
      ).rejects.toThrow('User has already submitted this form');
    });
  });

  describe('getResponsesByFormId', () => {
    it('should return responses for a given form', async () => {
      await service.submitResponse(testFormId, 'user-1', { f1: 20 });
      await service.submitResponse(testFormId, 'user-2', { f1: 22 });

      const responses = await service.getResponsesByFormId(testFormId);
      expect(responses.length).toBe(2);
    });
  });

  describe('getResponseById', () => {
    it('should return a specific response', async () => {
      const submitted = await service.submitResponse(testFormId, 'user-1', {
        f1: 20
      });

      const response = await service.getResponseById(submitted._id.toString());
      expect(response).toBeDefined();
      expect(response.userId).toBe('user-1');
    });

    it('should throw AppError if response not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(service.getResponseById(fakeId)).rejects.toThrow(
        'Form response not found'
      );
    });
  });
});

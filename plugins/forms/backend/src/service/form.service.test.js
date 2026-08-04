import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { FormModel } from '../schema/form.model.js';
import { createFormRepository } from '../repository/form.repository.js';
import { createFormService } from './form.service.js';

describe('FormService', () => {
  let service;
  let mongoServer;
  let mockEventBus;

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
    const formRepository = createFormRepository(FormModel);

    mockEventBus = {
      emit: () => {}
    };

    service = createFormService(formRepository, mockEventBus);
  });

  describe('createForm', () => {
    it('should create a new form and emit event', async () => {
      const formData = {
        title: 'Feedback Form',
        description: 'General feedback',
        entityType: 'club',
        entityId: new mongoose.Types.ObjectId().toString(),
        fields: [
          {
            id: 'field-1',
            label: 'Name',
            type: 'text',
            required: true
          }
        ]
      };

      let emittedEvent = null;
      mockEventBus.emit = (eventName, payload) => {
        emittedEvent = { eventName, payload };
      };

      const result = await service.createForm(formData);

      expect(result).toBeDefined();
      expect(result.title).toBe('Feedback Form');
      expect(result.entityType).toBe('club');

      expect(emittedEvent).not.toBeNull();
      expect(emittedEvent.eventName).toBe('form:created');
      expect(emittedEvent.payload.formId.toString()).toBe(
        result._id.toString()
      );
      expect(emittedEvent.payload.entityType).toBe('club');
    });
  });

  describe('getFormById', () => {
    it('should return a form by id', async () => {
      const form = await FormModel.create({
        title: 'Test Form',
        entityType: 'event',
        entityId: new mongoose.Types.ObjectId().toString(),
        fields: []
      });

      const result = await service.getFormById(form._id.toString());
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Form');
    });

    it('should throw AppError if form not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(service.getFormById(fakeId)).rejects.toThrow(
        'Form not found'
      );
    });
  });

  describe('getForms', () => {
    it('should return all forms with pagination defaults', async () => {
      await FormModel.create([
        { title: 'Form 1', entityType: 'event', entityId: 'e1', fields: [] },
        { title: 'Form 2', entityType: 'event', entityId: 'e2', fields: [] }
      ]);

      const results = await service.getForms();
      expect(results.length).toBe(2);
    });
  });

  describe('getFormsByEntity', () => {
    it('should return forms for a specific entity', async () => {
      const entityId = new mongoose.Types.ObjectId().toString();

      await FormModel.create([
        { title: 'Entity Form', entityType: 'club', entityId, fields: [] },
        {
          title: 'Other Form',
          entityType: 'event',
          entityId: 'other',
          fields: []
        }
      ]);

      const results = await service.getFormsByEntity('club', entityId);
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Entity Form');
    });
  });

  describe('updateForm', () => {
    it('should update an existing form', async () => {
      const form = await FormModel.create({
        title: 'Old Title',
        entityType: 'event',
        entityId: 'e1',
        fields: []
      });

      const updated = await service.updateForm(form._id.toString(), {
        title: 'New Title',
        status: 'active'
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe('New Title');
      expect(updated.status).toBe('active');
    });

    it('should throw AppError if form not found on update', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(
        service.updateForm(fakeId, { title: 'New' })
      ).rejects.toThrow('Form not found');
    });
  });
});

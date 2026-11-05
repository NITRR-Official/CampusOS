import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { FormModel } from '../schema/form.model.js';
import { FormResponseModel } from '../schema/form-response.model.js';
import { createFormService } from '../service/form.service.js';
import { createFormResponseService } from '../service/form-response.service.js';
import { createFormRepository } from '../repository/form.repository.js';
import { createFormResponseRepository } from '../repository/form-response.repository.js';
import { registerFormHandlers } from './index.js';

describe('Forms Listeners (Integration)', () => {
  let mongoServer;
  let formService;
  let formResponseService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    eventBus = new EventEmitter();
    const formRepo = createFormRepository(FormModel);
    const formRespRepo = createFormResponseRepository(FormResponseModel);

    formService = createFormService(formRepo, eventBus);
    formResponseService = createFormResponseService(
      formRespRepo,
      formRepo,
      eventBus
    );

    registerFormHandlers(eventBus, { formService, formResponseService });
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
  });

  describe('club:deleted listener', () => {
    it('should delete all forms and responses associated with the deleted club', async () => {
      const clubId = 'club-forms-to-delete';

      const form1 = await formService.createForm({
        title: 'Club Join Form',
        entityType: 'club',
        entityId: clubId,
        status: 'active',
        fields: [{ id: 'q1', label: 'Why join?', type: 'text' }]
      });

      const form2 = await formService.createForm({
        title: 'Feedback Form',
        entityType: 'club',
        entityId: clubId,
        status: 'active',
        fields: [{ id: 'q1', label: 'Feedback', type: 'text' }]
      });

      const otherForm = await formService.createForm({
        title: 'Other Club Form',
        entityType: 'club',
        entityId: 'other-club',
        status: 'active',
        fields: [{ id: 'q1', label: 'Question', type: 'text' }]
      });

      await formResponseService.submitResponse(form1._id, 'user-1', {
        q1: 'Interest in coding'
      });
      await formResponseService.submitResponse(form2._id, 'user-1', {
        q1: 'Great club!'
      });

      const formsBefore = await FormModel.find({
        entityType: 'club',
        entityId: clubId
      });
      expect(formsBefore.length).toBe(2);

      const respBefore = await FormResponseModel.find({
        formId: { $in: [form1._id, form2._id] }
      });
      expect(respBefore.length).toBe(2);

      eventBus.emit('club:deleted', { clubId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const formsAfter = await FormModel.find({
        entityType: 'club',
        entityId: clubId
      });
      expect(formsAfter.length).toBe(0);

      const respAfter = await FormResponseModel.find({
        formId: { $in: [form1._id, form2._id] }
      });
      expect(respAfter.length).toBe(0);

      const otherForms = await FormModel.find({ entityId: 'other-club' });
      expect(otherForms.length).toBe(1);
    });
  });

  describe('user:deleted listener', () => {
    it('should delete all responses submitted by the deleted user', async () => {
      const form = await formService.createForm({
        title: 'Survey Form',
        entityType: 'club',
        entityId: 'club-survey',
        status: 'active',
        fields: [{ id: 'ans', label: 'Answer', type: 'text' }]
      });

      await formResponseService.submitResponse(
        form._id,
        'user-to-delete-survey',
        {
          ans: 'Delete me'
        }
      );

      await formResponseService.submitResponse(form._id, 'user-keep-survey', {
        ans: 'Keep me'
      });

      const respBefore = await FormResponseModel.find({ formId: form._id });
      expect(respBefore.length).toBe(2);

      eventBus.emit('user:deleted', { userId: 'user-to-delete-survey' });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const respAfter = await FormResponseModel.find({ formId: form._id });
      expect(respAfter.length).toBe(1);
      expect(respAfter[0].userId).toBe('user-keep-survey');
    });
  });
});

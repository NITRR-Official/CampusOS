import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { Task } from '../schema/task.model.js';
import { createTaskService } from '../service/task.service.js';
import { createTaskRepository } from '../repository/task.repository.js';
import { registerTaskHandlers } from './index.js';

describe('Task Listeners (Integration)', () => {
  let mongoServer;
  let taskService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    eventBus = new EventEmitter();
    const taskRepo = createTaskRepository();
    taskService = createTaskService(taskRepo);
    taskService.setEventBus(eventBus);

    registerTaskHandlers(eventBus, {}, taskService);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Task.deleteMany({});
  });

  describe('club:deleted listener', () => {
    it('should delete all tasks associated with the deleted club', async () => {
      const clubId = 'club-delete-123';
      const createdBy = new mongoose.Types.ObjectId().toString();

      await taskService.createTask({
        clubId,
        title: 'Task 1',
        createdBy
      });

      await taskService.createTask({
        clubId,
        title: 'Task 2',
        createdBy
      });

      await taskService.createTask({
        clubId: 'other-club',
        title: 'Other Club Task',
        createdBy
      });

      const tasksBefore = await Task.find({ clubId });
      expect(tasksBefore.length).toBe(2);

      eventBus.emit('club:deleted', { clubId });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const tasksAfter = await Task.find({ clubId });
      expect(tasksAfter.length).toBe(0);

      const otherTasks = await Task.find({ clubId: 'other-club' });
      expect(otherTasks.length).toBe(1);
    });
  });

  describe('user:deleted listener', () => {
    it('should unassign tasks assigned to or created by the deleted user', async () => {
      const clubId = 'club-tasks-456';
      const userId = new mongoose.Types.ObjectId();

      const task = await Task.create({
        clubId,
        title: 'Assigned Task',
        createdBy: userId,
        assigneeId: userId,
        assigneeName: 'User To Delete'
      });

      expect(task.assigneeName).toBe('User To Delete');
      expect(task.assigneeId.toString()).toBe(userId.toString());

      eventBus.emit('user:deleted', { userId: userId.toString() });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const taskAfter = await Task.findById(task._id);
      expect(taskAfter.assigneeName).toBeNull();
      expect(taskAfter.assigneeId).toBeNull();
    });
  });
});

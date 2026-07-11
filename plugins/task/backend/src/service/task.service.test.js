import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Task } from '../schema/task.model.js';
import { getTaskService } from './task.service.js';

describe('TaskService', () => {
  let service;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  }, 120000);

  beforeEach(async () => {
    await Task.deleteMany({});
    service = getTaskService();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const task = await service.createTask({
        title: 'Review PRs',
        description: 'Review pending PRs for the backend',
        priority: 'high',
        createdBy: 'user_1'
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Review PRs');
      expect(task.priority).toBe('high');
      expect(task.status).toBe('todo');
      expect(task.dependsOn).toEqual([]);
    });
  });

  describe('assignTask & update properties', () => {
    it('should update task assignment, status, and priority', async () => {
      const task = await service.createTask({
        title: 'Update tests',
        createdBy: 'user_1'
      });

      const assigned = await service.assignTask(task._id || task.id, {
        assigneeName: 'Alice'
      });
      expect(assigned.assigneeName).toBe('Alice');

      const statusUpdate = await service.updateStatus(
        task._id || task.id,
        'in-progress'
      );
      expect(statusUpdate.status).toBe('in-progress');

      const priorityUpdate = await service.updatePriority(
        task._id || task.id,
        'high'
      );
      expect(priorityUpdate.priority).toBe('high');
    });
  });

  describe('dependencies', () => {
    it('should add dependency successfully', async () => {
      const task1 = await service.createTask({ title: 'T1', createdBy: 'u1' });
      const task2 = await service.createTask({ title: 'T2', createdBy: 'u1' });

      const res = await service.addDependency(
        task1._id || task1.id,
        task2._id || task2.id
      );
      expect(res.success).toBe(true);
      expect(res.task.dependsOn).toContainEqual(task2._id || task2.id);
    });

    it('should prevent circular dependencies', async () => {
      const task1 = await service.createTask({ title: 'T1', createdBy: 'u1' });
      const task2 = await service.createTask({ title: 'T2', createdBy: 'u1' });

      // T1 -> T2
      await service.addDependency(task1._id || task1.id, task2._id || task2.id);

      // T2 -> T1 should fail
      const res = await service.addDependency(
        task2._id || task2.id,
        task1._id || task1.id
      );
      expect(res.success).toBe(false);
      expect(res.error).toBe('CIRCULAR_DEPENDENCY');
    });

    it('should prevent self-reference dependencies', async () => {
      const task1 = await service.createTask({ title: 'T1', createdBy: 'u1' });

      const res = await service.addDependency(
        task1._id || task1.id,
        task1._id || task1.id
      );
      expect(res.success).toBe(false);
      expect(res.error).toBe('SELF_REFERENCE');
    });

    it('should remove dependency successfully', async () => {
      const task1 = await service.createTask({ title: 'T1', createdBy: 'u1' });
      const task2 = await service.createTask({ title: 'T2', createdBy: 'u1' });

      await service.addDependency(task1._id || task1.id, task2._id || task2.id);

      const res = await service.removeDependency(
        task1._id || task1.id,
        task2._id || task2.id
      );
      expect(res.success).toBe(true);
      expect(res.task.dependsOn).not.toContainEqual(task2._id || task2.id);
    });
  });
});

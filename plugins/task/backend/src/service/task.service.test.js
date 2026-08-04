import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Task } from '../schema/task.model.js';
import { createTaskService } from './task.service.js';
import { createTaskRepository } from '../repository/task.repository.js';

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
    const repository = createTaskRepository();
    service = createTaskService(repository);
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const task = await service.createTask({
        clubId: '507f191e810c19729de860ea',
        title: 'Review PRs',
        description: 'Review pending PRs for the backend',
        priority: 'high',
        createdBy: '507f1f77bcf86cd799439011'
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
        clubId: '507f191e810c19729de860ea',
        title: 'Update tests',
        createdBy: '507f1f77bcf86cd799439011'
      });

      const assigned = await service.assignTask(task.id, {
        assigneeName: 'Alice'
      });
      expect(assigned.assigneeName).toBe('Alice');

      const statusUpdate = await service.updateStatus(task.id, 'in-progress');
      expect(statusUpdate.status).toBe('in-progress');

      const priorityUpdate = await service.updatePriority(task.id, 'high');
      expect(priorityUpdate.priority).toBe('high');
    });
  });

  describe('dependencies', () => {
    it('should add dependency successfully', async () => {
      const task1 = await service.createTask({
        title: 'T1',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });
      const task2 = await service.createTask({
        title: 'T2',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });

      const res = await service.addDependency(task1.id, task2.id);

      expect(res).toBeDefined();
      expect(res.dependsOn.map((id) => id.toString())).toContainEqual(
        task2.id.toString()
      );
    });

    it('should prevent circular dependencies', async () => {
      const task1 = await service.createTask({
        title: 'T1',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });
      const task2 = await service.createTask({
        title: 'T2',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });

      // T1 -> T2
      await service.addDependency(task1.id, task2.id);

      // T2 -> T1 should fail
      await expect(service.addDependency(task2.id, task1.id)).rejects.toThrow(
        'Adding this dependency would create a circular reference'
      );
    });

    it('should prevent self-reference dependencies', async () => {
      const task1 = await service.createTask({
        title: 'T1',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });

      await expect(service.addDependency(task1.id, task1.id)).rejects.toThrow(
        'A task cannot depend on itself'
      );
    });

    it('should remove dependency successfully', async () => {
      const task1 = await service.createTask({
        title: 'T1',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });
      const task2 = await service.createTask({
        title: 'T2',
        clubId: '507f191e810c19729de860ea',
        createdBy: '507f1f77bcf86cd799439011'
      });

      await service.addDependency(task1.id, task2.id);

      const res = await service.removeDependency(task1.id, task2.id);

      expect(res).toBeDefined();
      expect(res.dependsOn.map((id) => id.toString())).not.toContainEqual(
        task2.id.toString()
      );
    });
  });
});

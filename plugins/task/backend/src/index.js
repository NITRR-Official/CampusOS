import { createTaskController } from './controller/task.controller.js';
import { registerTaskRoutes } from './routes/task.routes.js';
import { Task } from './schema/task.model.js';
import { registerTaskHandlers } from './listeners/index.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const { createTaskService } = await import('./service/task.service.js');
  const { createTaskRepository } =
    await import('./repository/task.repository.js');

  const taskRepository = createTaskRepository();
  const taskService = createTaskService(taskRepository);
  if (eventBus) {
    taskService.setEventBus(eventBus);
  }
  const taskController = createTaskController(taskService);
  registerTaskRoutes(app, taskController, requirePermissions);

  registry.registerModule('task', {
    routes: [
      '/api/v1/tasks',
      '/api/v1/tasks/:taskId',
      '/api/v1/tasks/:taskId/assign',
      '/api/v1/tasks/:taskId/status',
      '/api/v1/tasks/:taskId/priority'
    ]
  });

  if (registry.permissions) {
    registry.permissions.register({
      id: 'task:view',
      module: 'task',
      label: 'View Tasks',
      description: 'Allows viewing tasks'
    });
    registry.permissions.register({
      id: 'task:manage',
      module: 'task',
      label: 'Manage Tasks',
      description: 'Allows creating, assigning, and updating status of tasks'
    });

    registry.registerContextResolver('/api/v1/tasks', async (req) => {
      const taskId = req.params?.taskId || req.url.split('/')[4];
      if (!taskId) return null;
      try {
        const taskDoc = await Task.findById(taskId).select('clubId').lean();
        return taskDoc?.clubId
          ? { type: 'club:member_service', id: taskDoc.clubId.toString() }
          : null;
      } catch {
        return null;
      }
    });
  }

  if (eventBus) {
    registerTaskHandlers(eventBus, registry);
  }
}

export default init;

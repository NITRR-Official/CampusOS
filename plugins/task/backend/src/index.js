import { createTaskController } from './controller/task.controller.js';
import { registerTaskRoutes } from './routes/task.routes.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const taskController = createTaskController();
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
      id: 'task:manage',
      module: 'task',
      label: 'Manage Tasks',
      description: 'Allows creating, assigning, and updating status of tasks'
    });
  }
}

export default init;

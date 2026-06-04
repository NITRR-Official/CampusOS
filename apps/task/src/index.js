import { createTaskController } from './controller/task.controller.js';
import { registerTaskRoutes } from './routes/task.routes.js';

export async function init(app, registry, eventBus) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const taskController = createTaskController();
  registerTaskRoutes(app, taskController, requireRoles);

  registry.registerModule('task', {
    routes: [
      '/api/v1/tasks',
      '/api/v1/tasks/:taskId',
      '/api/v1/tasks/:taskId/assign',
      '/api/v1/tasks/:taskId/status',
      '/api/v1/tasks/:taskId/priority'
    ]
  });
}

export default init;

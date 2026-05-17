export function registerTaskRoutes(app, taskController, requireRoles) {
  const manageTasks = requireRoles('admin', 'coordinator');

  app.get('/api/v1/tasks', taskController.list);
  app.get('/api/v1/tasks/:taskId', taskController.getById);
  app.post('/api/v1/tasks', manageTasks, taskController.create);
  app.patch('/api/v1/tasks/:taskId/assign', manageTasks, taskController.assign);
  app.patch(
    '/api/v1/tasks/:taskId/status',
    manageTasks,
    taskController.updateStatus
  );
  app.patch(
    '/api/v1/tasks/:taskId/priority',
    manageTasks,
    taskController.updatePriority
  );
  app.post(
    '/api/v1/tasks/:taskId/dependencies',
    manageTasks,
    taskController.addDependency
  );
  app.delete(
    '/api/v1/tasks/:taskId/dependencies',
    manageTasks,
    taskController.removeDependency
  );
}

export default registerTaskRoutes;

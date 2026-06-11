export function registerTaskRoutes(app, taskController, requirePermissions) {
  app.get('/api/v1/tasks', taskController.list);
  app.get('/api/v1/tasks/:taskId', taskController.getById);
  
  // Task management routes guarded by task:manage permission
  app.post('/api/v1/tasks', requirePermissions('task:manage'), taskController.create);
  app.patch('/api/v1/tasks/:taskId/assign', requirePermissions('task:manage'), taskController.assign);
  app.patch(
    '/api/v1/tasks/:taskId/status',
    requirePermissions('task:manage'),
    taskController.updateStatus
  );
  app.patch(
    '/api/v1/tasks/:taskId/priority',
    requirePermissions('task:manage'),
    taskController.updatePriority
  );
  app.post(
    '/api/v1/tasks/:taskId/dependencies',
    requirePermissions('task:manage'),
    taskController.addDependency
  );
  app.delete(
    '/api/v1/tasks/:taskId/dependencies',
    requirePermissions('task:manage'),
    taskController.removeDependency
  );
}

export default registerTaskRoutes;

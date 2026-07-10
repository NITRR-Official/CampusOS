import {
  assignTaskSchema,
  createTaskSchema,
  updateTaskPrioritySchema,
  updateTaskStatusSchema
} from '../schema/task.schema.js';
import { getTaskService } from '../service/task.service.js';

function createHttpError(status, message, code, details) {
  const error = new Error(message);
  error.status = status;

  if (code) {
    error.code = code;
  }

  if (details) {
    error.details = details;
  }

  return error;
}

export function createTaskController() {
  const taskService = getTaskService();

  async function create(req, res, next) {
    try {
      const value = createTaskSchema.parse(req.body);
      const task = await taskService.createTask({
        ...value,
        createdBy: req.user?.id || 'unknown'
      });

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      const tasks = await taskService.listTasks();
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (err) {
      next(err);
    }
  }

  async function getById(req, res, next) {
    const { taskId } = req.params;
    try {
      const task = await taskService.getTask(taskId);

      if (!task) {
        next(createHttpError(404, 'Task not found', 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  }

  async function assign(req, res, next) {
    const { taskId } = req.params;

    try {
      const value = assignTaskSchema.parse(req.body);
      const task = await taskService.assignTask(taskId, value);

      if (!task) {
        next(createHttpError(404, 'Task not found', 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  }

  async function updateStatus(req, res, next) {
    const { taskId } = req.params;

    try {
      const value = updateTaskStatusSchema.parse(req.body);
      const task = await taskService.updateStatus(taskId, value.status);

      if (!task) {
        next(createHttpError(404, 'Task not found', 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  }

  async function updatePriority(req, res, next) {
    const { taskId } = req.params;

    try {
      const value = updateTaskPrioritySchema.parse(req.body);
      const task = await taskService.updatePriority(taskId, value.priority);

      if (!task) {
        next(createHttpError(404, 'Task not found', 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  }

  async function addDependency(req, res, next) {
    const { taskId } = req.params;
    const { dependencyId } = req.body;

    if (!dependencyId || typeof dependencyId !== 'string') {
      next(
        createHttpError(400, 'dependencyId is required', 'VALIDATION_ERROR')
      );
      return;
    }

    try {
      const result = await taskService.addDependency(taskId, dependencyId);

      if (!result.success) {
        const statusMap = {
          TASK_NOT_FOUND: 404,
          DEPENDENCY_NOT_FOUND: 404,
          SELF_REFERENCE: 400,
          DEPENDENCY_EXISTS: 409,
          CIRCULAR_DEPENDENCY: 409
        };

        const status = statusMap[result.error] || 400;
        const messages = {
          TASK_NOT_FOUND: 'Task not found',
          DEPENDENCY_NOT_FOUND: 'Dependency task not found',
          SELF_REFERENCE: 'A task cannot depend on itself',
          DEPENDENCY_EXISTS: 'Dependency already exists',
          CIRCULAR_DEPENDENCY:
            'Adding this dependency would create a circular reference'
        };

        next(createHttpError(status, messages[result.error], result.error));
        return;
      }

      res.status(200).json({
        success: true,
        data: result.task
      });
    } catch (err) {
      next(err);
    }
  }

  async function removeDependency(req, res, next) {
    const { taskId } = req.params;
    const { dependencyId } = req.body;

    if (!dependencyId || typeof dependencyId !== 'string') {
      next(
        createHttpError(400, 'dependencyId is required', 'VALIDATION_ERROR')
      );
      return;
    }

    try {
      const result = await taskService.removeDependency(taskId, dependencyId);

      if (!result.success) {
        const statusMap = {
          TASK_NOT_FOUND: 404,
          DEPENDENCY_NOT_FOUND: 404
        };

        const status = statusMap[result.error] || 400;
        const messages = {
          TASK_NOT_FOUND: 'Task not found',
          DEPENDENCY_NOT_FOUND: 'Dependency not found on this task'
        };

        next(createHttpError(status, messages[result.error], result.error));
        return;
      }

      res.status(200).json({
        success: true,
        data: result.task
      });
    } catch (err) {
      next(err);
    }
  }

  return {
    create,
    list,
    getById,
    assign,
    updateStatus,
    updatePriority,
    addDependency,
    removeDependency
  };
}

export default createTaskController;

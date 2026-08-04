import { AppError } from '@campus-os/shared/errors';
import {
  assignTaskSchema,
  createTaskSchema,
  updateTaskPrioritySchema,
  updateTaskStatusSchema
} from '../schema/task.schema.js';
export function createTaskController(taskService) {
  async function create(req, res, next) {
    try {
      const value = createTaskSchema.parse(req.body);
      const task = await taskService.createTask({
        ...value,
        createdBy: req.user?.id || 'unknown'
      });

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      const { clubId } = req.query;
      if (!clubId) {
        return next(
          new AppError(
            'clubId is required for listing tasks',
            400,
            'VALIDATION_ERROR'
          )
        );
      }
      const tasks = await taskService.listTasks(clubId);
      res.status(200).json(tasks);
    } catch (err) {
      next(err);
    }
  }

  async function getById(req, res, next) {
    const { taskId } = req.params;
    try {
      const task = await taskService.getTask(taskId);

      if (!task) {
        next(new AppError('Task not found', 404, 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json(task);
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
        next(new AppError('Task not found', 404, 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json(task);
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
        next(new AppError('Task not found', 404, 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json(task);
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
        next(new AppError('Task not found', 404, 'TASK_NOT_FOUND'));
        return;
      }

      res.status(200).json(task);
    } catch (err) {
      next(err);
    }
  }

  async function addDependency(req, res, next) {
    const { taskId } = req.params;
    const { dependencyId } = req.body;

    if (!dependencyId || typeof dependencyId !== 'string') {
      next(new AppError('dependencyId is required', 400, 'VALIDATION_ERROR'));
      return;
    }

    try {
      const task = await taskService.addDependency(taskId, dependencyId);

      res.status(200).json(task);
    } catch (err) {
      next(err);
    }
  }

  async function removeDependency(req, res, next) {
    const { taskId } = req.params;
    const { dependencyId } = req.body;

    if (!dependencyId || typeof dependencyId !== 'string') {
      next(new AppError('dependencyId is required', 400, 'VALIDATION_ERROR'));
      return;
    }

    try {
      const task = await taskService.removeDependency(taskId, dependencyId);

      res.status(200).json(task);
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

import { AppError } from '@campus-os/shared/errors';

function serializeTask(task) {
  if (!task) return null;
  const obj = task.toObject ? task.toObject() : task;
  const { _id, ...rest } = obj;
  return {
    ...rest,
    id: _id || obj.id,
    clubId: obj.clubId,
    assignedAt: obj.assignedAt || null,
    dueDate: obj.dueDate ? new Date(obj.dueDate).toISOString() : null,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null
  };
}

export function createTaskService(taskRepository) {
  let eventBus = null;

  async function _detectCircularDependency(
    taskId,
    dependencyId,
    visited = new Set()
  ) {
    const tId = taskId.toString();
    const dId = dependencyId.toString();

    if (visited.has(dId)) {
      return true; // Cycle detected
    }

    if (dId === tId) {
      return true; // Self-reference
    }

    visited.add(dId);

    const dependencyTask = await taskRepository.findById(dId);
    if (!dependencyTask) {
      return false; // Dependency doesn't exist, no cycle
    }

    // Check all dependencies of the dependency task
    if (dependencyTask.dependsOn) {
      for (const subDependencyId of dependencyTask.dependsOn) {
        if (
          await _detectCircularDependency(
            taskId,
            subDependencyId,
            new Set(visited)
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  return {
    setEventBus(eb) {
      eventBus = eb;
    },

    async createTask(payload) {
      const task = await taskRepository.create({
        clubId: payload.clubId,
        title: payload.title,
        description: payload.description || null,
        assigneeName: payload.assigneeName || null,
        dueDate: payload.dueDate || null,
        priority: payload.priority || 'medium',
        status: 'todo',
        dependsOn: [],
        createdBy: payload.createdBy
      });

      const serialized = serializeTask(task.toObject ? task.toObject() : task);
      if (eventBus) {
        eventBus.emit('task:created', {
          taskId: serialized.id,
          clubId: serialized.clubId,
          data: serialized
        });
      }
      return serialized;
    },

    async listTasks(clubId) {
      const tasks = await taskRepository.find(
        { clubId },
        { sort: { updatedAt: -1 } }
      );
      return tasks.map(serializeTask);
    },

    async getTask(taskId) {
      const task = await taskRepository.findById(taskId);
      return serializeTask(task);
    },

    async assignTask(taskId, payload) {
      const task = await taskRepository.updateById(taskId, {
        assigneeName: payload.assigneeName,
        assignedAt: new Date()
      });
      return serializeTask(task);
    },

    async updateStatus(taskId, status) {
      const task = await taskRepository.updateById(taskId, { status });
      const serialized = serializeTask(task);
      if (eventBus) {
        eventBus.emit('task:status_updated', {
          taskId: serialized.id,
          clubId: serialized.clubId,
          status: serialized.status,
          data: serialized
        });
      }
      return serialized;
    },

    async updatePriority(taskId, priority) {
      const task = await taskRepository.updateById(taskId, { priority });
      return serializeTask(task);
    },

    async addDependency(taskId, dependencyId) {
      const task = await taskRepository.findById(taskId);
      const dependency = await taskRepository.findById(dependencyId);

      if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
      }

      if (!dependency) {
        throw new AppError(
          'Dependency task not found',
          404,
          'DEPENDENCY_NOT_FOUND'
        );
      }

      if (taskId === dependencyId) {
        throw new AppError(
          'A task cannot depend on itself',
          400,
          'SELF_REFERENCE'
        );
      }

      if (
        task.dependsOn &&
        task.dependsOn.some((id) => id.toString() === dependencyId.toString())
      ) {
        throw new AppError(
          'Dependency already exists',
          409,
          'DEPENDENCY_EXISTS'
        );
      }

      if (await _detectCircularDependency(taskId, dependencyId)) {
        throw new AppError(
          'Adding this dependency would create a circular reference',
          409,
          'CIRCULAR_DEPENDENCY'
        );
      }

      const updatedTask = await taskRepository.updateById(taskId, {
        $push: { dependsOn: dependencyId }
      });

      return serializeTask(updatedTask);
    },

    async removeDependency(taskId, dependencyId) {
      const task = await taskRepository.findById(taskId);

      if (!task) {
        throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
      }

      if (
        !task.dependsOn ||
        !task.dependsOn.some((id) => id.toString() === dependencyId.toString())
      ) {
        throw new AppError(
          'Dependency not found on this task',
          404,
          'DEPENDENCY_NOT_FOUND'
        );
      }

      const updatedTask = await taskRepository.updateById(taskId, {
        $pull: { dependsOn: dependencyId }
      });

      return serializeTask(updatedTask);
    }
  };
}

export default createTaskService;

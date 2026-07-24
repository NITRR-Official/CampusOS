import { Task } from '../schema/task.model.js';

function serializeTask(task) {
  if (!task) return null;
  const { _id, ...rest } = task;
  return {
    ...rest,
    id: _id,
    clubId: task.clubId,
    assignedAt: task.assignedAt || null,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null
  };
}

class TaskService {
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  async createTask(payload) {
    const task = new Task({
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

    await task.save();
    const serialized = serializeTask(task.toObject());
    if (this.eventBus) {
      this.eventBus.emit('task:created', {
        taskId: serialized.id,
        clubId: serialized.clubId,
        data: serialized
      });
    }
    return serialized;
  }

  async listTasks(clubId) {
    const tasks = await Task.find({ clubId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    return tasks.map(serializeTask);
  }

  async getTask(taskId) {
    const task = await Task.findById(taskId).lean().exec();
    return serializeTask(task);
  }

  async assignTask(taskId, payload) {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { assigneeName: payload.assigneeName, assignedAt: new Date() },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();
    return serializeTask(task);
  }

  async updateStatus(taskId, status) {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();
    const serialized = serializeTask(task);
    if (this.eventBus) {
      this.eventBus.emit('task:status_updated', {
        taskId: serialized.id,
        clubId: serialized.clubId,
        status: serialized.status,
        data: serialized
      });
    }
    return serialized;
  }

  async updatePriority(taskId, priority) {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { priority },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();
    return serializeTask(task);
  }

  /**
   * Check if adding a dependency would create a circular reference
   * Uses DFS to detect cycles
   */
  async #detectCircularDependency(taskId, dependencyId, visited = new Set()) {
    if (visited.has(dependencyId)) {
      return true; // Cycle detected
    }

    if (dependencyId === taskId) {
      return true; // Self-reference
    }

    visited.add(dependencyId);

    const dependencyTask = await Task.findById(dependencyId).lean().exec();
    if (!dependencyTask) {
      return false; // Dependency doesn't exist, no cycle
    }

    // Check all dependencies of the dependency task
    if (dependencyTask.dependsOn) {
      for (const subDependencyId of dependencyTask.dependsOn) {
        if (
          await this.#detectCircularDependency(
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

  async addDependency(taskId, dependencyId) {
    const task = await Task.findById(taskId).lean().exec();
    const dependency = await Task.findById(dependencyId).lean().exec();

    if (!task) {
      return { success: false, error: 'TASK_NOT_FOUND' };
    }

    if (!dependency) {
      return { success: false, error: 'DEPENDENCY_NOT_FOUND' };
    }

    if (taskId === dependencyId) {
      return { success: false, error: 'SELF_REFERENCE' };
    }

    if (task.dependsOn && task.dependsOn.includes(dependencyId)) {
      return { success: false, error: 'DEPENDENCY_EXISTS' };
    }

    if (await this.#detectCircularDependency(taskId, dependencyId)) {
      return { success: false, error: 'CIRCULAR_DEPENDENCY' };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $push: { dependsOn: dependencyId } },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();

    return { success: true, task: serializeTask(updatedTask) };
  }

  async removeDependency(taskId, dependencyId) {
    const task = await Task.findById(taskId).lean().exec();

    if (!task) {
      return { success: false, error: 'TASK_NOT_FOUND' };
    }

    if (!task.dependsOn || !task.dependsOn.includes(dependencyId)) {
      return { success: false, error: 'DEPENDENCY_NOT_FOUND' };
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { dependsOn: dependencyId } },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();

    return { success: true, task: serializeTask(updatedTask) };
  }
}

const taskService = new TaskService();

export function getTaskService() {
  return taskService;
}

export default getTaskService;

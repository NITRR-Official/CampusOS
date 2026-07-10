import { Task } from '../schema/task.model.js';

class TaskService {
  async createTask(payload) {
    const task = new Task({
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
    return task.toObject();
  }

  async listTasks() {
    return Task.find().sort({ updatedAt: -1 }).lean().exec();
  }

  async getTask(taskId) {
    return Task.findById(taskId).lean().exec();
  }

  async assignTask(taskId, payload) {
    return Task.findByIdAndUpdate(
      taskId,
      { assigneeName: payload.assigneeName },
      { new: true }
    )
      .lean()
      .exec();
  }

  async updateStatus(taskId, status) {
    return Task.findByIdAndUpdate(taskId, { status }, { new: true })
      .lean()
      .exec();
  }

  async updatePriority(taskId, priority) {
    return Task.findByIdAndUpdate(taskId, { priority }, { new: true })
      .lean()
      .exec();
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
      { new: true }
    )
      .lean()
      .exec();

    return { success: true, task: updatedTask };
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
      { new: true }
    )
      .lean()
      .exec();

    return { success: true, task: updatedTask };
  }
}

const taskService = new TaskService();

export function getTaskService() {
  return taskService;
}

export default getTaskService;

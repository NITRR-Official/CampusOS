import crypto from 'node:crypto';
import { Role } from '../../../club/src/schema/role.schema.js';

const tasksById = new Map();

async function resolveTeamMentions(text, clubId) {
  if (!text || !clubId) return [];
  const matches = text.match(/@([\w-]+)/g);
  if (!matches) return [];

  const teamNames = matches.map((m) => m.substring(1).toLowerCase());

  try {
    // Find matching roles of type 'team' in the club
    const teams = await Role.find({
      clubId,
      roleType: 'team'
    }).lean();

    const mentionedTeamIds = [];
    teams.forEach((team) => {
      if (team && team.name && teamNames.includes(team.name.toLowerCase())) {
        mentionedTeamIds.push(team._id.toString());
      }
    });

    return mentionedTeamIds;
  } catch (error) {
    console.error('[TaskService] Error resolving team mentions:', error.message);
    return [];
  }
}

function createTaskRecord(payload) {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: payload.title,
    description: payload.description || null,
    assigneeName: payload.assigneeName || null,
    assignedTeamId: payload.assignedTeamId || null,
    mentionedTeams: [],
    dueDate: payload.dueDate || null,
    priority: payload.priority || 'medium',
    status: 'todo',
    dependsOn: [], // Array of task IDs this task depends on
    createdBy: payload.createdBy,
    clubId: payload.clubId || null,
    assignedAt: (payload.assigneeName || payload.assignedTeamId) ? now : null,
    createdAt: now,
    updatedAt: now
  };
}

class TaskService {
  async createTask(payload) {
    const task = createTaskRecord(payload);

    if (payload.clubId) {
      task.mentionedTeams = await resolveTeamMentions(
        `${payload.title} ${payload.description || ''}`,
        payload.clubId
      );
    }

    tasksById.set(task.id, task);
    return task;
  }

  listTasks() {
    return Array.from(tasksById.values()).sort((left, right) => {
      return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    });
  }

  getTask(taskId) {
    return tasksById.get(taskId) || null;
  }

  async assignTask(taskId, payload) {
    const task = tasksById.get(taskId);

    if (!task) {
      return null;
    }

    task.assigneeName = payload.assigneeName || null;
    task.assignedTeamId = payload.assignedTeamId || null;
    task.assignedAt = new Date().toISOString();
    task.updatedAt = task.assignedAt;

    if (task.clubId) {
      task.mentionedTeams = await resolveTeamMentions(
        `${task.title} ${task.description || ''}`,
        task.clubId
      );
    }

    return task;
  }

  updateStatus(taskId, status) {
    const task = tasksById.get(taskId);

    if (!task) {
      return null;
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    return task;
  }

  updatePriority(taskId, priority) {
    const task = tasksById.get(taskId);

    if (!task) {
      return null;
    }

    task.priority = priority;
    task.updatedAt = new Date().toISOString();

    return task;
  }

  /**
   * Check if adding a dependency would create a circular reference
   * Uses DFS to detect cycles
   */
  #detectCircularDependency(taskId, dependencyId, visited = new Set()) {
    if (visited.has(dependencyId)) {
      return true; // Cycle detected
    }

    if (dependencyId === taskId) {
      return true; // Self-reference
    }

    visited.add(dependencyId);

    const dependencyTask = tasksById.get(dependencyId);
    if (!dependencyTask) {
      return false; // Dependency doesn't exist, no cycle
    }

    // Check all dependencies of the dependency task
    for (const subDependencyId of dependencyTask.dependsOn) {
      if (
        this.#detectCircularDependency(
          taskId,
          subDependencyId,
          new Set(visited)
        )
      ) {
        return true;
      }
    }

    return false;
  }

  addDependency(taskId, dependencyId) {
    const task = tasksById.get(taskId);
    const dependency = tasksById.get(dependencyId);

    if (!task) {
      return { success: false, error: 'TASK_NOT_FOUND' };
    }

    if (!dependency) {
      return { success: false, error: 'DEPENDENCY_NOT_FOUND' };
    }

    if (taskId === dependencyId) {
      return { success: false, error: 'SELF_REFERENCE' };
    }

    if (task.dependsOn.includes(dependencyId)) {
      return { success: false, error: 'DEPENDENCY_EXISTS' };
    }

    if (this.#detectCircularDependency(taskId, dependencyId)) {
      return { success: false, error: 'CIRCULAR_DEPENDENCY' };
    }

    task.dependsOn.push(dependencyId);
    task.updatedAt = new Date().toISOString();

    return { success: true, task };
  }

  removeDependency(taskId, dependencyId) {
    const task = tasksById.get(taskId);

    if (!task) {
      return { success: false, error: 'TASK_NOT_FOUND' };
    }

    const index = task.dependsOn.indexOf(dependencyId);
    if (index === -1) {
      return { success: false, error: 'DEPENDENCY_NOT_FOUND' };
    }

    task.dependsOn.splice(index, 1);
    task.updatedAt = new Date().toISOString();

    return { success: true, task };
  }
}

const taskService = new TaskService();

export function getTaskService() {
  return taskService;
}

export default getTaskService;

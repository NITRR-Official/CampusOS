import { apiClient } from './api/client';
export { ApiError as TaskApiError } from './api/errors';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dependsOn: string[];
  createdBy: string;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function fetchTasks(accessToken?: string) {
  return apiClient.get<TaskItem[]>('/tasks', { accessToken });
}

export function createTask(
  accessToken: string | undefined,
  payload: {
    title: string;
    description: string;
    assigneeName: string;
    dueDate: string;
    priority: TaskPriority;
  }
) {
  return apiClient.post<TaskItem>('/tasks', payload, { accessToken });
}

export function assignTask(
  accessToken: string | undefined,
  taskId: string,
  assigneeName: string
) {
  return apiClient.patch<TaskItem>(
    `/tasks/${taskId}/assign`,
    { assigneeName },
    { accessToken }
  );
}

export function updateTaskStatus(
  accessToken: string | undefined,
  taskId: string,
  status: TaskStatus
) {
  return apiClient.patch<TaskItem>(
    `/tasks/${taskId}/status`,
    { status },
    { accessToken }
  );
}

export function updateTaskPriority(
  accessToken: string | undefined,
  taskId: string,
  priority: TaskPriority
) {
  return apiClient.patch<TaskItem>(
    `/tasks/${taskId}/priority`,
    { priority },
    { accessToken }
  );
}

export function addTaskDependency(
  accessToken: string | undefined,
  taskId: string,
  dependencyId: string
) {
  return apiClient.post<TaskItem>(
    `/tasks/${taskId}/dependencies`,
    { dependencyId },
    { accessToken }
  );
}

export function removeTaskDependency(
  accessToken: string | undefined,
  taskId: string,
  dependencyId: string
) {
  return apiClient.delete<TaskItem>(
    `/tasks/${taskId}/dependencies`,
    { dependencyId },
    { accessToken }
  );
}

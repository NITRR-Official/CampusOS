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
  dependsOn: string[]; // Array of task IDs this task depends on
  createdBy: string;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TaskApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'TaskApiError';
    this.status = status;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request(
  path: string,
  init?: RequestInit,
  accessToken?: string | null
) {
  const headers = new Headers(init?.headers || {});

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new TaskApiError(json?.message || 'Request failed', response.status);
  }

  return json?.data;
}

export function fetchTasks(accessToken: string) {
  return request('/api/v1/tasks', undefined, accessToken) as Promise<
    TaskItem[]
  >;
}

export function createTask(
  accessToken: string,
  payload: {
    title: string;
    description: string;
    assigneeName: string;
    dueDate: string;
    priority: TaskPriority;
  }
) {
  return request(
    '/api/v1/tasks',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    accessToken
  ) as Promise<TaskItem>;
}

export function assignTask(
  accessToken: string,
  taskId: string,
  assigneeName: string
) {
  return request(
    `/api/v1/tasks/${taskId}/assign`,
    {
      method: 'PATCH',
      body: JSON.stringify({ assigneeName })
    },
    accessToken
  ) as Promise<TaskItem>;
}

export function updateTaskStatus(
  accessToken: string,
  taskId: string,
  status: TaskStatus
) {
  return request(
    `/api/v1/tasks/${taskId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status })
    },
    accessToken
  ) as Promise<TaskItem>;
}

export function updateTaskPriority(
  accessToken: string,
  taskId: string,
  priority: TaskPriority
) {
  return request(
    `/api/v1/tasks/${taskId}/priority`,
    {
      method: 'PATCH',
      body: JSON.stringify({ priority })
    },
    accessToken
  ) as Promise<TaskItem>;
}

export function addTaskDependency(
  accessToken: string,
  taskId: string,
  dependencyId: string
) {
  return request(
    `/api/v1/tasks/${taskId}/dependencies`,
    {
      method: 'POST',
      body: JSON.stringify({ dependencyId })
    },
    accessToken
  ) as Promise<TaskItem>;
}

export function removeTaskDependency(
  accessToken: string,
  taskId: string,
  dependencyId: string
) {
  return request(
    `/api/v1/tasks/${taskId}/dependencies`,
    {
      method: 'DELETE',
      body: JSON.stringify({ dependencyId })
    },
    accessToken
  ) as Promise<TaskItem>;
}

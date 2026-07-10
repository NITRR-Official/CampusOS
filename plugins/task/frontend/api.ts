import { apiClient } from '@/lib/api/client';
import { z } from 'zod';
export { ApiError as TaskApiError } from '@/lib/api/errors';

export const TaskStatusSchema = z.enum(['todo', 'in-progress', 'done']);
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  assigneeName: z.string().nullable(),
  dueDate: z.string().nullable(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  dependsOn: z.array(z.string()),
  createdBy: z.string(),
  assignedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;

export function fetchTasks(accessToken?: string) {
  return apiClient.get<TaskItem[]>('/tasks', {
    accessToken,
    schema: z.array(TaskItemSchema)
  });
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
  return apiClient.post<TaskItem>('/tasks', payload, {
    accessToken,
    schema: TaskItemSchema
  });
}

export function assignTask(
  accessToken: string | undefined,
  taskId: string,
  assigneeName: string
) {
  return apiClient.patch<TaskItem>(
    `/tasks/${taskId}/assign`,
    { assigneeName },
    { accessToken, schema: TaskItemSchema }
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
    { accessToken, schema: TaskItemSchema }
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
    { accessToken, schema: TaskItemSchema }
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
    { accessToken, schema: TaskItemSchema }
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
    { accessToken, schema: TaskItemSchema }
  );
}

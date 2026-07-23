import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  createTask,
  assignTask,
  updateTaskStatus,
  updateTaskPriority,
  addTaskDependency,
  removeTaskDependency,
  TaskApiError,
  type TaskItem
} from '@plugins/task/frontend/api';
import {
  readAccessToken,
  clearAuthSession
} from '@campus-os/shared/auth-session';

export function useTasks(clubId: string) {
  const accessToken = readAccessToken();

  const query = useQuery({
    queryKey: ['tasks', accessToken, clubId],
    queryFn: async () => {
      if (!accessToken || !clubId) return [];
      try {
        return await fetchTasks(accessToken, clubId);
      } catch (exception: any) {
        if (exception instanceof TaskApiError && exception.status === 401) {
          clearAuthSession();
        }
        throw exception;
      }
    },
    enabled: !!accessToken
  });

  const tasks = query.data || [];

  const taskCounts = {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    active: tasks.filter((task) => task.status === 'in-progress').length,
    done: tasks.filter((task) => task.status === 'done').length
  };

  return {
    accessToken,
    tasks,
    error: query.error ? (query.error as Error).message : '',
    isLoading: query.isLoading,
    taskCounts,
    refetch: query.refetch
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: (payload: Parameters<typeof createTask>[1]) =>
      createTask(accessToken || undefined, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', accessToken, variables.clubId]
      });
    }
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({
      taskId,
      assigneeName
    }: {
      taskId: string;
      assigneeName: string;
      clubId: string;
    }) => assignTask(accessToken || undefined, taskId, assigneeName),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', accessToken, variables.clubId]
      });
    }
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
      clubId
    }: {
      taskId: string;
      status: any;
      clubId: string;
    }) => updateTaskStatus(accessToken || undefined, taskId, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', accessToken, variables.clubId]
      });
    }
  });
}

export function useUpdateTaskPriority() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({
      taskId,
      priority,
      clubId
    }: {
      taskId: string;
      priority: any;
      clubId: string;
    }) => updateTaskPriority(accessToken || undefined, taskId, priority),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', accessToken, variables.clubId]
      });
    }
  });
}

export function useAddTaskDependency() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({
      taskId,
      dependencyId
    }: {
      taskId: string;
      dependencyId: string;
      clubId: string;
    }) => addTaskDependency(accessToken || undefined, taskId, dependencyId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', accessToken, variables.clubId]
      });
    }
  });
}

export function useRemoveTaskDependency() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({
      taskId,
      dependencyId
    }: {
      taskId: string;
      dependencyId: string;
      clubId: string;
    }) => removeTaskDependency(accessToken || undefined, taskId, dependencyId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', accessToken, variables.clubId]
      });
    }
  });
}

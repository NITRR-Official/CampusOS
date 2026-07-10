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
import { readAccessToken, clearAuthSession } from '@/lib/auth-session';

export function useTasks() {
  const accessToken = readAccessToken();

  const query = useQuery({
    queryKey: ['tasks', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      try {
        return await fetchTasks(accessToken);
      } catch (exception: any) {
        if (exception instanceof TaskApiError && exception.status === 401) {
          clearAuthSession();
        }
        throw exception;
      }
    },
    enabled: !!accessToken,
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
    mutationFn: (payload: Parameters<typeof createTask>[1]) => createTask(accessToken || undefined, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({ taskId, assigneeName }: { taskId: string, assigneeName: string }) => assignTask(accessToken || undefined, taskId, assigneeName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string, status: any }) => updateTaskStatus(accessToken || undefined, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTaskPriority() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({ taskId, priority }: { taskId: string, priority: any }) => updateTaskPriority(accessToken || undefined, taskId, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useAddTaskDependency() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({ taskId, dependencyId }: { taskId: string, dependencyId: string }) => addTaskDependency(accessToken || undefined, taskId, dependencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useRemoveTaskDependency() {
  const queryClient = useQueryClient();
  const accessToken = readAccessToken();

  return useMutation({
    mutationFn: ({ taskId, dependencyId }: { taskId: string, dependencyId: string }) => removeTaskDependency(accessToken || undefined, taskId, dependencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
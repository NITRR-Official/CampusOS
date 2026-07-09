import { useEffect, useState, useMemo } from 'react';
import { clearAuthSession, readAccessToken } from '@/lib/auth-session';
import {
  fetchTasks,
  TaskApiError,
  type TaskItem,
  type TaskPriority
} from '@/lib/task-api';

export function useTasks() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAccessToken(readAccessToken());
  }, []);

  useEffect(() => {
    async function loadTasks(currentToken: string) {
      setIsLoading(true);
      setError('');

      try {
        const items = await fetchTasks(currentToken);
        setTasks(items);
      } catch (exception) {
        if (exception instanceof TaskApiError && exception.status === 401) {
          clearAuthSession();
          setAccessToken(null);
          setError('Your session expired. Please log in again.');
          return;
        }

        setError(
          exception instanceof TaskApiError
            ? exception.message
            : 'Unable to load tasks right now.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      void loadTasks(accessToken);
    } else {
      setIsLoading(false);
    }
  }, [accessToken]);

  const taskCounts = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'todo').length,
      active: tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length
    };
  }, [tasks]);

  function handleTaskChange(updatedTask: TaskItem) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  }

  function handleTaskError(message: string) {
    setError(message);
  }

  return {
    accessToken,
    tasks,
    setTasks,
    error,
    setError,
    isLoading,
    taskCounts,
    handleTaskChange,
    handleTaskError
  };
}

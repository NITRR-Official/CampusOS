'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  TaskApiError,
  type TaskItem,
  type TaskPriority,
  type TaskStatus
} from '@plugins/task/frontend/api';
import {
  useAssignTask,
  useUpdateTaskStatus,
  useUpdateTaskPriority,
  useAddTaskDependency,
  useRemoveTaskDependency
} from '../hooks/useTasks';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];
const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in-progress', 'done'];

function formatDate(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
}

export interface TaskCardProps {
  task: TaskItem;
  allTasks: TaskItem[];
  accessToken: string;
}

export function TaskCard({ task, allTasks, accessToken }: TaskCardProps) {
  const [assigneeName, setAssigneeName] = useState(task.assigneeName || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [localError, setLocalError] = useState('');

  const assignTaskMutation = useAssignTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const updatePriorityMutation = useUpdateTaskPriority();
  const addDependencyMutation = useAddTaskDependency();
  const removeDependencyMutation = useRemoveTaskDependency();

  const isSaving =
    assignTaskMutation.isPending ||
    updateStatusMutation.isPending ||
    updatePriorityMutation.isPending ||
    addDependencyMutation.isPending ||
    removeDependencyMutation.isPending;

  useEffect(() => {
    setAssigneeName(task.assigneeName || '');
    setStatus(task.status);
    setPriority(task.priority);
  }, [task]);

  const availableDependencies = allTasks.filter(
    (t) => t.id !== task.id && !task.dependsOn.includes(t.id)
  );

  const dependencyTasks = allTasks.filter((t) => task.dependsOn.includes(t.id));

  function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError('');
    assignTaskMutation.mutate(
      { taskId: task.id, assigneeName },
      {
        onError: (error: any) => {
          setLocalError(
            error instanceof TaskApiError
              ? error.message
              : 'Unable to reassign task right now.'
          );
        }
      }
    );
  }

  function handleStatusChange(nextStatus: TaskStatus) {
    setStatus(nextStatus);
    setLocalError('');
    updateStatusMutation.mutate(
      { taskId: task.id, status: nextStatus },
      {
        onError: (error: any) => {
          setStatus(task.status);
          setLocalError(
            error instanceof TaskApiError
              ? error.message
              : 'Unable to update status right now.'
          );
        }
      }
    );
  }

  function handlePriorityChange(nextPriority: TaskPriority) {
    setPriority(nextPriority);
    setLocalError('');
    updatePriorityMutation.mutate(
      { taskId: task.id, priority: nextPriority },
      {
        onError: (error: any) => {
          setPriority(task.priority);
          setLocalError(
            error instanceof TaskApiError
              ? error.message
              : 'Unable to update priority right now.'
          );
        }
      }
    );
  }

  function handleAddDependency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDependency) return;

    setLocalError('');
    addDependencyMutation.mutate(
      { taskId: task.id, dependencyId: selectedDependency },
      {
        onSuccess: () => {
          setSelectedDependency('');
        },
        onError: (error: any) => {
          setLocalError(
            error instanceof TaskApiError
              ? error.message
              : 'Unable to add dependency right now.'
          );
        }
      }
    );
  }

  function handleRemoveDependency(dependencyId: string) {
    setLocalError('');
    removeDependencyMutation.mutate(
      { taskId: task.id, dependencyId },
      {
        onError: (error: any) => {
          setLocalError(
            error instanceof TaskApiError
              ? error.message
              : 'Unable to remove dependency right now.'
          );
        }
      }
    );
  }

  return (
    <article className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Task
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            {task.title}
          </h3>
        </div>
        <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="rounded-full bg-muted/80 px-3 py-1">
            {task.status}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
            {task.priority}
          </span>
        </div>
      </div>

      {task.description ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      {localError && (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {localError}
        </p>
      )}

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="font-medium text-muted-foreground">Assignee</dt>
          <dd className="mt-1 text-foreground">
            {task.assigneeName || 'Unassigned'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Due</dt>
          <dd className="mt-1 text-foreground">{formatDate(task.dueDate)}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Created</dt>
          <dd className="mt-1 text-foreground">{formatDate(task.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Updated</dt>
          <dd className="mt-1 text-foreground">{formatDate(task.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          className="rounded-2xl border border-border bg-muted p-4"
          onSubmit={handleAssign}
        >
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reassign
          </label>
          <div className="flex gap-2">
            <input
              value={assigneeName}
              onChange={(event) => setAssigneeName(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Team member name"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </form>

        <div className="grid gap-3 rounded-2xl border border-border bg-muted p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as TaskStatus)
              }
              className="mt-2 w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Priority
            <select
              value={priority}
              onChange={(event) =>
                handlePriorityChange(event.target.value as TaskPriority)
              }
              className="mt-2 w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Dependencies Section */}
      <div className="mt-5 rounded-2xl border border-border bg-muted p-4">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dependencies
        </label>

        {dependencyTasks.length > 0 ? (
          <div className="mb-4 space-y-2">
            {dependencyTasks.map((depTask) => (
              <div
                key={depTask.id}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-card px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{depTask.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Status: {depTask.status}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveDependency(depTask.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            No dependencies set
          </p>
        )}

        <form onSubmit={handleAddDependency} className="flex gap-2">
          <select
            value={selectedDependency}
            onChange={(event) => setSelectedDependency(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Add dependency...</option>
            {availableDependencies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!selectedDependency || isSaving}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add
          </button>
        </form>
      </div>
    </article>
  );
}

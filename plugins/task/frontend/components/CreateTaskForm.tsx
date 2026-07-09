'use client';

import { FormEvent, useState } from 'react';
import {
  createTask,
  TaskApiError,
  type TaskPriority,
  type TaskItem
} from '@/lib/task-api';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];

interface CreateTaskFormProps {
  accessToken: string;
  onTaskCreated: (task: TaskItem) => void;
  onError: (error: string) => void;
}

export function CreateTaskForm({
  accessToken,
  onTaskCreated,
  onError
}: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    onError('');

    try {
      const task = await createTask(accessToken, {
        title,
        description,
        assigneeName,
        dueDate,
        priority
      });

      onTaskCreated(task);
      setTitle('');
      setDescription('');
      setAssigneeName('');
      setDueDate('');
      setPriority('medium');
    } catch (exception) {
      onError(
        exception instanceof TaskApiError
          ? exception.message
          : 'Unable to create task right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-sm"
      onSubmit={handleCreateTask}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            New task
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Create work item
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Title
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Prepare event checklist"
            minLength={3}
            maxLength={140}
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-28 w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Add scope, context, or execution notes."
            maxLength={1000}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Assignee
            </span>
            <input
              value={assigneeName}
              onChange={(event) => setAssigneeName(event.target.value)}
              className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Team member name"
              minLength={2}
              maxLength={80}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Due date
            </span>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Priority
          </span>
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as TaskPriority)
            }
            className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={!accessToken || isSubmitting}
          className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating task...' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

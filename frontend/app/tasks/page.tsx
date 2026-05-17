'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { clearAuthSession, readAccessToken } from '@/lib/auth-session';
import {
  addTaskDependency,
  assignTask,
  createTask,
  fetchTasks,
  removeTaskDependency,
  TaskApiError,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
  updateTaskPriority,
  updateTaskStatus
} from '@/lib/task-api';

const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];
const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in-progress', 'done'];

function formatDate(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
}

interface TaskCardProps {
  task: TaskItem;
  allTasks: TaskItem[];
  accessToken: string;
  onTaskChange: (task: TaskItem) => void;
  onTaskError: (message: string) => void;
}

function TaskCard({
  task,
  allTasks,
  accessToken,
  onTaskChange,
  onTaskError
}: TaskCardProps) {
  const [assigneeName, setAssigneeName] = useState(task.assigneeName || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [selectedDependency, setSelectedDependency] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAssigneeName(task.assigneeName || '');
    setStatus(task.status);
    setPriority(task.priority);
  }, [task]);

  // Get available tasks that can be dependencies (exclude self and existing dependencies)
  const availableDependencies = allTasks.filter(
    (t) => t.id !== task.id && !task.dependsOn.includes(t.id)
  );

  // Get the names of dependent tasks
  const dependencyTasks = allTasks.filter((t) => task.dependsOn.includes(t.id));

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const updatedTask = await assignTask(accessToken, task.id, assigneeName);
      onTaskChange(updatedTask);
    } catch (error) {
      onTaskError(
        error instanceof TaskApiError
          ? error.message
          : 'Unable to reassign task right now.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(nextStatus: TaskStatus) {
    setStatus(nextStatus);

    try {
      const updatedTask = await updateTaskStatus(
        accessToken,
        task.id,
        nextStatus
      );
      onTaskChange(updatedTask);
    } catch (error) {
      setStatus(task.status);
      onTaskError(
        error instanceof TaskApiError
          ? error.message
          : 'Unable to update status right now.'
      );
    }
  }

  async function handlePriorityChange(nextPriority: TaskPriority) {
    setPriority(nextPriority);

    try {
      const updatedTask = await updateTaskPriority(
        accessToken,
        task.id,
        nextPriority
      );
      onTaskChange(updatedTask);
    } catch (error) {
      setPriority(task.priority);
      onTaskError(
        error instanceof TaskApiError
          ? error.message
          : 'Unable to update priority right now.'
      );
    }
  }

  async function handleAddDependency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDependency) return;

    setIsSaving(true);

    try {
      const updatedTask = await addTaskDependency(
        accessToken,
        task.id,
        selectedDependency
      );
      onTaskChange(updatedTask);
      setSelectedDependency('');
    } catch (error) {
      onTaskError(
        error instanceof TaskApiError
          ? error.message
          : 'Unable to add dependency right now.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveDependency(dependencyId: string) {
    try {
      const updatedTask = await removeTaskDependency(
        accessToken,
        task.id,
        dependencyId
      );
      onTaskChange(updatedTask);
    } catch (error) {
      onTaskError(
        error instanceof TaskApiError
          ? error.message
          : 'Unable to remove dependency right now.'
      );
    }
  }

  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Task
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            {task.title}
          </h3>
        </div>
        <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {task.status}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
            {task.priority}
          </span>
        </div>
      </div>

      {task.description ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          {task.description}
        </p>
      ) : null}

      <dl className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Assignee</dt>
          <dd className="mt-1 text-slate-900">
            {task.assigneeName || 'Unassigned'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Due</dt>
          <dd className="mt-1 text-slate-900">{formatDate(task.dueDate)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Created</dt>
          <dd className="mt-1 text-slate-900">{formatDate(task.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Updated</dt>
          <dd className="mt-1 text-slate-900">{formatDate(task.updatedAt)}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          onSubmit={handleAssign}
        >
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reassign
          </label>
          <div className="flex gap-2">
            <input
              value={assigneeName}
              onChange={(event) => setAssigneeName(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Team member name"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </form>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(event.target.value as TaskStatus)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Priority
            <select
              value={priority}
              onChange={(event) =>
                handlePriorityChange(event.target.value as TaskPriority)
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Dependencies
        </label>

        {dependencyTasks.length > 0 ? (
          <div className="mb-4 space-y-2">
            {dependencyTasks.map((depTask) => (
              <div
                key={depTask.id}
                className="flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{depTask.title}</p>
                  <p className="text-xs text-slate-500">
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
          <p className="mb-4 text-sm text-slate-500">No dependencies set</p>
        )}

        <form onSubmit={handleAddDependency} className="flex gap-2">
          <select
            value={selectedDependency}
            onChange={(event) => setSelectedDependency(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add
          </button>
        </form>
      </div>
    </article>
  );
}

export default function TasksPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError('Please log in to create tasks.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const task = await createTask(accessToken, {
        title,
        description,
        assigneeName,
        dueDate,
        priority
      });

      setTasks((currentTasks) => [task, ...currentTasks]);
      setTitle('');
      setDescription('');
      setAssigneeName('');
      setDueDate('');
      setPriority('medium');
    } catch (exception) {
      setError(
        exception instanceof TaskApiError
          ? exception.message
          : 'Unable to create task right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <section
          className="rounded-4xl border border-slate-200 p-8 shadow-sm shadow-slate-200/60"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                Phase 3
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Task dashboard
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Plan work, assign owners, and move tasks through the execution
                flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/events"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                View events
              </Link>
              <Link
                href="/"
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: 'Total tasks', value: taskCounts.total },
              { label: 'Todo', value: taskCounts.todo },
              { label: 'In progress', value: taskCounts.active },
              { label: 'Done', value: taskCounts.done }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {!accessToken ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="text-xl font-semibold">Sign in required</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Log in to create and manage tasks. Your session is stored locally
              after authentication.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900"
            >
              Go to login
            </Link>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
            onSubmit={handleCreateTask}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  New task
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Create work item
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Prepare event checklist"
                  minLength={3}
                  maxLength={140}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Add scope, context, or execution notes."
                  maxLength={1000}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assignee
                  </span>
                  <input
                    value={assigneeName}
                    onChange={(event) => setAssigneeName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Team member name"
                    minLength={2}
                    maxLength={80}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due date
                  </span>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                </span>
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value as TaskPriority)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!accessToken || isSubmitting}
                className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Creating task...' : 'Create task'}
              </button>
            </div>
          </form>

          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Task queue
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Execution list
                  </h2>
                </div>
                {isLoading ? (
                  <span className="text-sm text-slate-500">Loading...</span>
                ) : null}
              </div>

              <div className="mt-6 space-y-4">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      allTasks={tasks}
                      accessToken={accessToken || ''}
                      onTaskChange={handleTaskChange}
                      onTaskError={handleTaskError}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                    No tasks yet. Create the first execution item to get
                    started.
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </MainLayout>
  );
}

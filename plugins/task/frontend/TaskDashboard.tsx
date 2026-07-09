'use client';

import Link from 'next/link';
import { TaskCard } from './components/TaskCard';
import { CreateTaskForm } from './components/CreateTaskForm';
import { useTasks } from './hooks/useTasks';
import type { TaskItem } from '@/lib/task-api';

export function TaskDashboard() {
  const {
    accessToken,
    tasks,
    setTasks,
    error,
    setError,
    isLoading,
    taskCounts,
    handleTaskChange,
    handleTaskError
  } = useTasks();

  function handleTaskCreated(task: TaskItem) {
    setTasks((currentTasks) => [task, ...currentTasks]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-4xl border border-border bg-card text-card-foreground p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Phase 3
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Task dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Plan work, assign owners, and move tasks through the execution
              flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/events"
              className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:bg-muted"
            >
              View events
            </Link>
            <Link
              href="/"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
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
              className="rounded-2xl border border-white/60 bg-card/75 p-4 backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
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
            className="mt-4 inline-flex rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-amber-900"
          >
            Go to login
          </Link>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <CreateTaskForm
            accessToken={accessToken || ''}
            onTaskCreated={handleTaskCreated}
            onError={setError}
          />
          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <section className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Task queue
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">
                  Execution list
                </h2>
              </div>
              {isLoading ? (
                <span className="text-sm text-muted-foreground">
                  Loading...
                </span>
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
                <div className="rounded-3xl border border-dashed border-border/80 bg-muted p-10 text-center text-muted-foreground">
                  No tasks yet. Create the first execution item to get started.
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

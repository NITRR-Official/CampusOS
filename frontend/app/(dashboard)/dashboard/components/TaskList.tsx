import { Circle, CircleDot, CheckCircle2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DashboardTask,
  TaskPriority,
  TaskStatus
} from '@/lib/mock/dashboard';

const statusIcon: Record<TaskStatus, LucideIcon> = {
  todo: Circle,
  in_progress: CircleDot,
  done: CheckCircle2
};

const statusColor: Record<TaskStatus, string> = {
  todo: 'text-muted-foreground',
  in_progress: 'text-primary',
  done: 'text-emerald-500'
};

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-orange-500/10 text-orange-500',
  high: 'bg-red-500/10 text-red-500'
};

function formatDue(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

export function TaskList({ tasks }: { tasks: DashboardTask[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <ul className="divide-y divide-border/60">
        {tasks.map((task) => {
          const StatusIcon = statusIcon[task.status];
          const isDone = task.status === 'done';
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <StatusIcon
                className={cn('size-5 shrink-0', statusColor[task.status])}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'm-0 truncate text-sm font-medium',
                    isDone
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  )}
                >
                  {task.title}
                </p>
                <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                  {task.assignee} · due {formatDue(task.due)}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                  priorityStyles[task.priority]
                )}
              >
                {task.priority}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

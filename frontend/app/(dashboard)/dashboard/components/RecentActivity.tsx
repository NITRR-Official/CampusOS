import {
  Calendar,
  Users,
  CheckSquare,
  UserPlus,
  Box,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityKind, DashboardActivity } from '@/lib/mock/dashboard';

const kindIcon: Record<ActivityKind, LucideIcon> = {
  event: Calendar,
  club: Users,
  task: CheckSquare,
  member: UserPlus,
  resource: Box
};

const kindAccent: Record<ActivityKind, string> = {
  event: 'bg-violet-500/10 text-violet-500',
  club: 'bg-orange-500/10 text-orange-500',
  task: 'bg-emerald-500/10 text-emerald-500',
  member: 'bg-primary/10 text-primary',
  resource: 'bg-sky-500/10 text-sky-500'
};

/**
 * Formats an ISO timestamp deterministically (fixed locale + UTC) so the
 * server-rendered markup stays stable and avoids hydration drift.
 */
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

export function RecentActivity({
  activities
}: {
  activities: DashboardActivity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card/80 p-8 text-center shadow-sm backdrop-blur md:p-12">
        <p className="m-0 text-sm text-muted-foreground md:text-base">
          No recent activity. Create a club or schedule an event to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <ul className="divide-y divide-border/60">
        {activities.map((item) => {
          const Icon = kindIcon[item.kind];
          return (
            <li
              key={item.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
            >
              <div
                className={cn(
                  'flex h-10 w-10 min-w-fit items-center justify-center rounded-lg',
                  kindAccent[item.kind]
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm text-foreground">
                  <span className="font-semibold">{item.actor}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>{' '}
                  <span className="font-medium">{item.target}</span>
                </p>
              </div>
              <time
                dateTime={item.timestamp}
                className="shrink-0 text-xs text-muted-foreground"
              >
                {formatTimestamp(item.timestamp)}
              </time>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

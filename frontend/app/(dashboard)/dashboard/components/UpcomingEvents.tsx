import { MapPin, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardEvent, EventCategory } from '@/lib/mock/dashboard';

const categoryStyles: Record<EventCategory, string> = {
  meeting: 'bg-primary/10 text-primary',
  workshop: 'bg-emerald-500/10 text-emerald-500',
  competition: 'bg-violet-500/10 text-violet-500',
  cultural: 'bg-orange-500/10 text-orange-500',
  deadline: 'bg-red-500/10 text-red-500'
};

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC'
  });
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit',
    timeZone: 'UTC'
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

function MetaItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function UpcomingEvents({ events }: { events: DashboardEvent[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur">
      <ul className="divide-y divide-border/60">
        {events.map((event) => (
          <li
            key={event.id}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <div
              className={cn(
                'flex h-12 w-12 min-w-fit flex-col items-center justify-center rounded-lg',
                categoryStyles[event.category]
              )}
            >
              <span className="text-[10px] font-semibold uppercase leading-none">
                {formatMonth(event.date)}
              </span>
              <span className="text-lg font-bold leading-tight">
                {formatDay(event.date)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-sm font-semibold text-foreground">
                {event.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <MetaItem icon={MapPin} label={event.location} />
                {event.attendees > 0 ? (
                  <MetaItem
                    icon={Users}
                    label={`${event.attendees} attending`}
                  />
                ) : null}
              </div>
            </div>
            <time
              dateTime={event.date}
              className="shrink-0 text-xs font-medium text-muted-foreground"
            >
              {formatTime(event.date)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}

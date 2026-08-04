import { fetchEventById } from '@plugins/event/frontend/api';
import { notFound } from 'next/navigation';
import {
  CalendarIcon,
  MapPin,
  Users,
  Activity,
  TrendingUp
} from 'lucide-react';
import { cookies } from 'next/headers';

export default async function EventOverviewPage({
  params
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const resolvedParams = await params;
  const { eventId } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('campusos_access_token')?.value;

  const event = await fetchEventById(eventId, token).catch(() => null);

  if (!event) {
    notFound();
  }

  const registrationsCount = event.registrations?.length || 0;
  const capacity = event.capacity || 'Unlimited';

  const stats = [
    {
      name: 'Total Registrations',
      value: registrationsCount,
      icon: Users,
      trend: 'Registered attendees',
      trendUp: true
    },
    {
      name: 'Capacity',
      value: capacity,
      icon: Activity,
      trend:
        capacity !== 'Unlimited'
          ? `${Math.round((registrationsCount / (event.capacity || 1)) * 100)}% filled`
          : 'N/A',
      trendUp: false
    },
    {
      name: 'Event Status',
      value: event.status.charAt(0).toUpperCase() + event.status.slice(1),
      icon: TrendingUp,
      trend:
        event.status === 'published'
          ? 'Live on public profile'
          : 'Not visible publicly',
      trendUp: event.status === 'published'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          A high-level summary of your event&apos;s performance and details.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-border/50 bg-background p-6 flex flex-col shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </span>
              <stat.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-extrabold">{stat.value}</div>
            <div className="mt-2 flex items-center text-xs">
              <span
                className={
                  stat.trendUp ? 'text-emerald-500' : 'text-muted-foreground'
                }
              >
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Event Details</h3>
          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground flex items-center gap-2">
                <CalendarIcon className="size-4" /> Date & Time
              </dt>
              <dd className="font-medium text-right">
                {new Date(event.startsAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground flex items-center gap-2">
                <MapPin className="size-4" /> Venue
              </dt>
              <dd className="font-medium text-right">
                {event.venue || 'Not specified'}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground flex items-center gap-2">
                <Users className="size-4" /> Created By
              </dt>
              <dd className="font-medium text-right truncate max-w-[200px]">
                {event.createdBy}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Description Preview</h3>
          <div className="prose prose-sm dark:prose-invert text-muted-foreground line-clamp-6">
            {event.description || 'No description provided.'}
          </div>
        </div>
      </div>
    </div>
  );
}

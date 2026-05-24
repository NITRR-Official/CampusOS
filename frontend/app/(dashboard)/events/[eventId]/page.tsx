import Link from 'next/link';

import RegisterForm from './RegisterForm';
import { fetchEventById } from '@/lib/event-api';

export const dynamic = 'force-dynamic';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString();
}

export default async function EventDetailPage({
  params
}: EventDetailPageProps) {
  const { eventId } = await params;
  const event = await fetchEventById(eventId);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/events"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back to events
      </Link>

      <div className="mt-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold text-foreground">
            {event.title}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              event.status === 'published'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {event.status}
          </span>
        </div>

        <p className="mt-4 text-muted-foreground">
          {event.description || 'No description available for this event.'}
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground">Start</p>
            <p className="font-medium text-foreground">
              {formatDate(event.startsAt)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground">End</p>
            <p className="font-medium text-foreground">
              {event.endsAt ? formatDate(event.endsAt) : 'TBA'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground">Venue</p>
            <p className="font-medium text-foreground">
              {event.venue || 'TBA'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-muted-foreground">Capacity</p>
            <p className="font-medium text-foreground">
              {event.capacity || 'Unlimited'}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border p-5">
          <h2 className="text-xl font-semibold text-foreground">
            Register for this event
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current registrations: {event.registrations.length}
          </p>
          <div className="mt-4">
            <RegisterForm eventId={event.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

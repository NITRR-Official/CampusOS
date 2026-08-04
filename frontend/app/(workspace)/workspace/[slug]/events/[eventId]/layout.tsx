import { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cookies } from 'next/headers';
import { fetchEventById } from '@plugins/event/frontend/api';
import { EventNav } from '@plugins/event/frontend/components/EventNav';

export default async function EventWorkspaceLayout(props: {
  children: ReactNode;
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const params = await props.params;
  const { slug, eventId } = params;

  const cookieStore = await cookies();
  const token = cookieStore.get('campusos_access_token')?.value;

  let event = null;
  try {
    event = await fetchEventById(eventId, token);
  } catch (error) {
    console.error('Failed to fetch event for workspace:', error);
  }

  if (!event) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 h-full flex flex-col">
      <div className="flex items-center gap-4 shrink-0">
        <Link
          href={`/workspace/${slug}/events`}
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {event.title}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                event.status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-600'
                  : 'bg-amber-500/20 text-amber-600'
              }`}
            >
              {event.status}
            </span>
          </div>
          <p className="text-muted-foreground">
            Manage your event details, participants, and settings.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 h-full min-h-[500px]">
        <EventNav clubId={slug} eventId={event.id || event._id!} />

        <main className="flex-1 min-w-0 bg-card/40 border border-border/50 rounded-2xl p-6 shadow-sm">
          {props.children}
        </main>
      </div>
    </div>
  );
}

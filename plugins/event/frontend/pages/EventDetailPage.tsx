import Link from 'next/link';
import { fetchEventById } from '../api';
import { RegisterForm } from '../components/RegisterForm';
import { Calendar, MapPin, Users, ChevronLeft, Info } from 'lucide-react';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export async function EventDetailPage({
  params
}: EventDetailPageProps) {
  const { eventId } = await params;
  const event = await fetchEventById(eventId);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Navigation */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Events
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Banner Area */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary/30 via-secondary/20 to-primary/10 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        </div>

        {/* Event Info */}
        <div className="px-6 md:px-10 pb-10 relative -mt-16">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border backdrop-blur-md ${event.status === 'published' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${event.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                  <span className="capitalize">{event.status}</span>
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground border border-border">
                  Public Event
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
                {event.title}
              </h1>
            </div>

            <div className="w-full md:w-auto shrink-0 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Date
                </p>
                <p className="text-lg font-bold text-primary">
                  {new Date(event.startsAt).getDate()}
                </p>
                <p className="text-sm font-medium">
                  {new Date(event.startsAt).toLocaleString('en-US', {
                    month: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info className="size-5 text-primary" />
              About This Event
            </h2>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground bg-card/30 backdrop-blur rounded-2xl border border-border/50 p-6 md:p-8">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {event.description ||
                  'No description available for this event.'}
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-2xl rounded-full" />
            <h3 className="font-bold text-xl flex items-center gap-2">
              Event Details
            </h3>

            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex shrink-0 aspect-square size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(event.startsAt)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(event.startsAt)}{' '}
                    {event.endsAt && `- ${formatTime(event.endsAt)}`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex shrink-0 aspect-square size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {event.venue || 'TBA'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Location
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex shrink-0 aspect-square size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {event.registrations.length} /{' '}
                    {event.capacity || 'Unlimited'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registrations
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 text-foreground">
                Join the Event
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Reserve your spot now. Limited seats may be available.
              </p>
              <RegisterForm eventId={event.id} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

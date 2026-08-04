import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicEventById } from '@plugins/event/frontend/api';
import { fetchClubBySlug } from '@plugins/club/frontend/api';
import { CalendarIcon, MapPin, Users, ArrowLeft } from 'lucide-react';
import { EventRegistrationForm } from '@plugins/event/frontend/components/EventRegistrationForm';

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default async function PublicEventPage({
  params
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const resolvedParams = await params;
  const { slug, eventId } = resolvedParams;

  const [club, event] = await Promise.all([
    fetchClubBySlug(slug).catch(() => null),
    fetchPublicEventById(eventId).catch(() => null)
  ]);

  if (!club || !event) {
    notFound();
  }

  // Double check the event actually belongs to the club
  if (event.clubId !== club.id && event.clubId !== club._id) {
    notFound();
  }

  const isFull =
    event.capacity != null && (event.registrationsCount || 0) >= event.capacity;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
        <Link
          href={`/clubs/${slug}`}
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to {club.name}
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 md:p-12 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                <CalendarIcon className="size-4 text-primary" />
                {formatDate(event.startsAt)}
              </div>
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                <MapPin className="size-4 text-primary" />
                {event.venue || 'Venue TBA'}
              </div>
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                <Users className="size-4 text-primary" />
                {event.registrationsCount || 0} / {event.capacity || '∞'}{' '}
                Attending
              </div>
            </div>

            <div className="prose prose-sm md:prose-base dark:prose-invert">
              <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {event.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="w-full md:w-80 shrink-0">
            <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur p-6 shadow-sm sticky top-8">
              <h3 className="text-lg font-bold mb-2">Registration</h3>
              {isFull ? (
                <div className="text-center p-4 bg-amber-500/10 text-amber-600 rounded-xl font-medium border border-amber-500/20">
                  Event is fully booked
                </div>
              ) : (
                <EventRegistrationForm eventId={event.id || event._id!} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

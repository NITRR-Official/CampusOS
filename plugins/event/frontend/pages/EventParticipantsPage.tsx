import { fetchEventById } from '../api';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { CheckInDesk } from '@plugins/checkin/frontend';

export async function EventParticipantsPage({
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

  const registrations = (event.registrations || []).map((r: any) => ({
    id: r.id || r._id,
    userId: r.userId,
    attendeeName: r.attendeeName,
    attendeeEmail: r.attendeeEmail,
    createdAt: r.createdAt || new Date().toISOString(),
    customResponses: r.customResponses || {}
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Attendance & Check-In Desk
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage enrolled attendees and verify entrance check-ins for{' '}
          <strong className="text-foreground">{event.title}</strong>.
        </p>
      </div>

      <CheckInDesk
        eventId={eventId}
        eventTitle={event.title}
        initialRegistrations={registrations}
      />
    </div>
  );
}

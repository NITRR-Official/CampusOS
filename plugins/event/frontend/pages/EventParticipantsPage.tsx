import { fetchEventById, fetchEventRegistrations } from '../api';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ExtensionPoint } from '@campus-os/shared/extension-point';

export async function EventParticipantsPage({
  params
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const resolvedParams = await params;
  const { eventId } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('campusos_access_token')?.value;

  const [event, regData] = await Promise.all([
    fetchEventById(eventId, token).catch(() => null),
    fetchEventRegistrations(eventId, token).catch(() => null)
  ]);

  if (!event) {
    notFound();
  }

  const rawList = regData?.registrations || event.registrations || [];
  const registrations = rawList.map((r: any) => ({
    id: r.id || (r._id ? String(r._id) : Math.random().toString()),
    userId: r.userId ? String(r.userId) : undefined,
    attendeeName: r.attendeeName,
    attendeeEmail: r.attendeeEmail,
    createdAt: r.createdAt ? String(r.createdAt) : new Date().toISOString(),
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

      <ExtensionPoint
        id="event-checkin-desk"
        context={{ eventId, eventTitle: event.title, registrations }}
        fallback={
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
            <h3 className="font-semibold text-lg text-foreground">
              Attendee List ({registrations.length} registered)
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Live barcode/QR check-in verification is managed by the Check-In
              plugin. Enable or install the Check-In plugin to scan tickets and
              record attendance.
            </p>
          </div>
        }
      />
    </div>
  );
}

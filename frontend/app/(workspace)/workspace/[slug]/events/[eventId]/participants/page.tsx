import { fetchEventById } from '@plugins/event/frontend/api';
import { notFound } from 'next/navigation';
import { Users, Mail, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';

export default async function EventParticipantsPage({
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

  const registrations = event.registrations || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Participants</h2>
          <p className="text-muted-foreground">
            Manage attendees registered for {event.title}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-background">
            <Mail className="size-4" />
            Email All
          </Button>
          <Button variant="outline" className="gap-2 bg-background">
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-background overflow-hidden shadow-sm">
        {registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No participants yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When people register for this event, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Attendee</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {registrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {reg.attendeeName}
                      </div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        {reg.attendeeEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

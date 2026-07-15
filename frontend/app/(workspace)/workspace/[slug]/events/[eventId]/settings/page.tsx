import { fetchEventById } from '@plugins/event/frontend/api';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cookies } from 'next/headers';

export default async function EventSettingsPage({
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

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Update event details, visibility, and configuration.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input defaultValue={event.title} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea defaultValue={event.description || ''} rows={5} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-background p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Logistics</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <Input
                type="datetime-local"
                defaultValue={
                  event.startsAt
                    ? new Date(event.startsAt).toISOString().slice(0, 16)
                    : ''
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                defaultValue={
                  event.endsAt
                    ? new Date(event.endsAt).toISOString().slice(0, 16)
                    : ''
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Venue / Location</Label>
              <Input defaultValue={event.venue || ''} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Capacity (Leave empty for unlimited)</Label>
              <Input type="number" defaultValue={event.capacity || ''} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button>Save Logistics</Button>
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-4">
            Danger Zone
          </h3>

          <div className="flex items-center justify-between py-4 border-b border-rose-500/20">
            <div>
              <p className="font-medium text-foreground">Visibility Status</p>
              <p className="text-sm text-muted-foreground">
                Currently this event is{' '}
                <strong className="uppercase">{event.status}</strong>.
              </p>
            </div>
            <Button
              variant="outline"
              className={
                event.status === 'published'
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-emerald-500 hover:text-emerald-600'
              }
            >
              {event.status === 'published'
                ? 'Unpublish Event'
                : 'Publish Event'}
            </Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-foreground">Delete Event</p>
              <p className="text-sm text-muted-foreground">
                Permanently remove this event and all registrations. This action
                cannot be undone.
              </p>
            </div>
            <Button variant="destructive">Delete Event</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

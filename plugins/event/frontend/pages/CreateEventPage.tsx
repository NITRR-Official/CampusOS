'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@campusos/design-system';
import { Input } from '@campusos/design-system';
import { Label } from '@campusos/design-system';
import { Textarea } from '@campusos/design-system';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { createEvent } from '../api';

export function CreateEventPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.slug as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const startsAtStr = formData.get('startsAt') as string;
    const endsAtStr = formData.get('endsAt') as string;
    const capacityStr = formData.get('capacity') as string;
    const venue = formData.get('venue') as string;
    const description = formData.get('description') as string;

    const payload = {
      title: formData.get('title'),
      description: description ? description : undefined,
      venue: venue ? venue : undefined,
      startsAt: startsAtStr ? new Date(startsAtStr).toISOString() : undefined,
      endsAt: endsAtStr ? new Date(endsAtStr).toISOString() : undefined,
      capacity: capacityStr ? parseInt(capacityStr, 10) : undefined,
      clubId,
      instituteId: 'default-institute' // Ideally this comes from user context
    };

    try {
      const res = await createEvent(payload);
      const newEventId = res.id || res._id;

      router.refresh();

      if (newEventId) {
        router.push(`/workspace/${clubId}/events/${newEventId}`);
      } else {
        router.push(`/workspace/${clubId}/events`);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create event. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link
          href={`/workspace/${clubId}/events`}
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Create New Event
          </h1>
          <p className="text-muted-foreground">
            Schedule a new event, workshop, or meetup.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Event Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Annual Tech Symposium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What is this event about?"
              rows={5}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startsAt">
                Start Date & Time <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">End Date & Time</Label>
              <Input id="endsAt" name="endsAt" type="datetime-local" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue / Location</Label>
              <Input
                id="venue"
                name="venue"
                placeholder="e.g. Main Auditorium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

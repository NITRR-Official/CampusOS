'use client';

import { useState } from 'react';
import { registerForEvent } from '../api';
import { Button } from '@campusos/design-system';
import { Input } from '@campusos/design-system';
import { Label } from '@campusos/design-system';
import { CheckCircle2 } from 'lucide-react';

export function EventRegistrationForm({ eventId }: { eventId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      await registerForEvent(eventId, {
        attendeeName: name,
        attendeeEmail: email
      });
      setSuccess(true);
    } catch (err: any) {
      if (err?.message === 'Event capacity reached') {
        setError('Sorry, this event is already fully booked.');
      } else if (err?.message === 'Already registered for this event') {
        setError('You have already registered with this email address.');
      } else {
        setError(err?.message || 'Failed to register. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
        <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle2 className="size-6" />
        </div>
        <h4 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
          Registered!
        </h4>
        <p className="text-sm text-muted-foreground">
          Your spot has been confirmed. We've sent the details to your email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Jane Doe"
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="e.g. jane@example.com"
          required
          className="bg-background"
        />
      </div>

      {error && (
        <div className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Secure My Spot'}
      </Button>
    </form>
  );
}

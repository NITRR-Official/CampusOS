'use client';

import { FormEvent, useState } from 'react';
import { EventApiError, registerForEvent } from '@/lib/event-api';

interface RegisterFormProps {
  eventId: string;
}

export default function RegisterForm({ eventId }: RegisterFormProps) {
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await registerForEvent(eventId, { attendeeName, attendeeEmail });
      setSuccess('Registration successful. See you at the event.');
      setAttendeeName('');
      setAttendeeEmail('');
    } catch (err) {
      if (err instanceof EventApiError) {
        setError(err.message);
      } else {
        setError('Unable to register right now. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
          htmlFor="attendeeName"
        >
          Name
        </label>
        <input
          id="attendeeName"
          type="text"
          value={attendeeName}
          onChange={(event) => setAttendeeName(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
          required
          minLength={2}
          maxLength={80}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600"
          htmlFor="attendeeEmail"
        >
          Email
        </label>
        <input
          id="attendeeEmail"
          type="email"
          value={attendeeEmail}
          onChange={(event) => setAttendeeEmail(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
          required
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

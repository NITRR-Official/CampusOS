/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { FormEvent, useState } from 'react';
import { EventApiError } from '@plugins/event/frontend/api';
import { useRegisterForEvent } from '@plugins/event/frontend/hooks';

interface RegisterFormProps {
  eventId: string;
}

export default function RegisterForm({ eventId }: RegisterFormProps) {
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const registerMutation = useRegisterForEvent(eventId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    registerMutation.mutate(
      { attendeeName, attendeeEmail },
      {
        onSuccess: () => {
          setSuccess('Registration successful. See you at the event.');
          setAttendeeName('');
          setAttendeeEmail('');
        },
        onError: (err: any) => {
          if (err instanceof EventApiError) {
            setError(err.message);
          } else {
            setError('Unable to register right now. Please try again.');
          }
        }
      }
    );
  }

  const isLoading = registerMutation.isPending;

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

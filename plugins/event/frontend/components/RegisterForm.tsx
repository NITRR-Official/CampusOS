'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Ticket, AlertCircle } from 'lucide-react';
import { useAuth } from '@campus-os/shared/auth-provider';
import { EventApiError } from '@plugins/event/frontend/api';
import { useRegisterForEvent } from '@plugins/event/frontend/hooks';
import { useEntityForms, useSubmitFormResponse } from '@plugins/forms/frontend';
import type { FormField } from '@plugins/forms/frontend/types/form';

interface RegisterFormProps {
  eventId: string;
  capacity?: number;
  currentCount?: number;
  initialRegistrations?: Array<{ attendeeEmail?: string; userId?: string }>;
}

export function RegisterForm({
  eventId,
  capacity,
  currentCount = 0,
  initialRegistrations = []
}: RegisterFormProps) {
  const { user } = useAuth();
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [customResponses, setCustomResponses] = useState<Record<string, any>>(
    {}
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Prefill user profile if logged in
  useEffect(() => {
    if (user?.name && !attendeeName) {
      setAttendeeName(user.name);
    }
    if (user?.email && !attendeeEmail) {
      setAttendeeEmail(user.email);
    }
  }, [user, attendeeName, attendeeEmail]);

  // Query custom dynamic forms attached to this event
  const { data: entityForms } = useEntityForms('event', eventId);
  const activeForm =
    Array.isArray(entityForms) && entityForms.length > 0
      ? entityForms[0]
      : null;

  const registerMutation = useRegisterForEvent(eventId);
  const submitFormMutation = useSubmitFormResponse(
    activeForm?.id || activeForm?._id || ''
  );

  const isAlreadyRegistered =
    Boolean(success) ||
    Boolean(
      user &&
      initialRegistrations?.some(
        (reg) =>
          (user.id && reg.userId === user.id) ||
          (user.email &&
            reg.attendeeEmail?.toLowerCase() === user.email.toLowerCase())
      )
    );

  const isCapacityReached =
    Boolean(capacity) &&
    capacity! > 0 &&
    currentCount >= capacity! &&
    !isAlreadyRegistered;

  function handleCustomFieldChange(fieldId: string, value: any) {
    setCustomResponses((prev) => ({
      ...prev,
      [fieldId]: value
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    registerMutation.mutate(
      { attendeeName, attendeeEmail, customResponses },
      {
        onSuccess: async () => {
          // If active form exists, submit response record to forms engine as well
          if (activeForm && Object.keys(customResponses).length > 0) {
            try {
              await submitFormMutation.mutateAsync(customResponses);
            } catch (formErr) {
              console.warn('Form response logging warning:', formErr);
            }
          }
          setSuccess(
            'Registration confirmed! Your digital event ticket has been generated.'
          );
        },
        onError: (err: any) => {
          if (err instanceof EventApiError) {
            setError(err.message);
          } else if (err?.response?.data?.message) {
            setError(err.response.data.message);
          } else {
            setError('Unable to register right now. Please try again.');
          }
        }
      }
    );
  }

  if (isAlreadyRegistered) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-950 dark:text-emerald-100 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-base text-emerald-900 dark:text-emerald-200">
              You are registered!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Your registration is confirmed. Check your digital ticket and QR
              code anytime.
            </p>
          </div>
        </div>

        <Link
          href="/my-events"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
        >
          <Ticket className="size-4" />
          View Digital Pass in My Events
        </Link>
      </div>
    );
  }

  if (isCapacityReached) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-100 space-y-2">
        <div className="flex items-center gap-3">
          <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200">
            Capacity Reached
          </h4>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300">
          This event has reached its maximum participant limit of {capacity}.
        </p>
      </div>
    );
  }

  const isLoading = registerMutation.isPending || submitFormMutation.isPending;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          htmlFor="attendeeName"
        >
          Full Name
        </label>
        <input
          id="attendeeName"
          type="text"
          value={attendeeName}
          onChange={(event) => setAttendeeName(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="e.g. Alex Morgan"
          required
          minLength={2}
          maxLength={80}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          htmlFor="attendeeEmail"
        >
          Email Address
        </label>
        <input
          id="attendeeEmail"
          type="email"
          value={attendeeEmail}
          onChange={(event) => setAttendeeEmail(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="alex@example.com"
          required
        />
      </div>

      {/* Render dynamic form fields if configured */}
      {activeForm?.fields && activeForm.fields.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
              Registration Questions
            </h5>
            {activeForm.description && (
              <p className="text-xs text-muted-foreground">
                {activeForm.description}
              </p>
            )}
          </div>

          {activeForm.fields.map((field: FormField) => (
            <div key={field.id} className="space-y-1">
              <label
                htmlFor={`field_${field.id}`}
                className="block text-xs font-medium text-foreground"
              >
                {field.label}{' '}
                {field.required && <span className="text-destructive">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={`field_${field.id}`}
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  value={customResponses[field.id] || ''}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary resize-y min-h-[70px]"
                />
              ) : field.type === 'select' ? (
                <select
                  id={`field_${field.id}`}
                  required={field.required}
                  value={customResponses[field.id] || ''}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, e.target.value)
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">
                    {field.placeholder || 'Select an option'}
                  </option>
                  {field.options?.map((opt: string, i: number) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id={`field_${field.id}`}
                    type="checkbox"
                    checked={Boolean(customResponses[field.id])}
                    onChange={(e) =>
                      handleCustomFieldChange(field.id, e.target.checked)
                    }
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`field_${field.id}`}
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    {field.placeholder || 'I agree / Yes'}
                  </label>
                </div>
              ) : (
                <input
                  id={`field_${field.id}`}
                  type={
                    field.type === 'number'
                      ? 'number'
                      : field.type === 'email'
                        ? 'email'
                        : 'text'
                  }
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  value={customResponses[field.id] || ''}
                  onChange={(e) =>
                    handleCustomFieldChange(
                      field.id,
                      field.type === 'number'
                        ? Number(e.target.value)
                        : e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900/60 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900/60 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
      >
        {isLoading ? 'Confirming Registration...' : 'Register for Event'}
      </button>
    </form>
  );
}

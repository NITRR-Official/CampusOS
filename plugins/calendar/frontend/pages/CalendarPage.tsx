'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

import {
  CalendarApiError,
  type CalendarEvent,
  type CalendarEventType
} from '@plugins/calendar/frontend/api';
import {
  useCalendarEventsByRange,
  useCreateCalendarEvent,
  useDeleteCalendarEvent
} from '@plugins/calendar/frontend/hooks';

const EVENT_TYPES: CalendarEventType[] = [
  'task-deadline',
  'event',
  'milestone'
];

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface EventListProps {
  events: CalendarEvent[];
  onDelete: (eventId: string) => void;
}

function EventList({ events, onDelete }: EventListProps) {
  return (
    <div className="space-y-2">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events for this period.
        </p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-border bg-card p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {event.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(event.startsAt)} {formatTime(event.startsAt)}
                </p>
                <span className="mt-2 inline-block rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {event.eventType}
                </span>
              </div>
              <button
                onClick={() => onDelete(event.id)}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface CalendarGridProps {
  currentDate: Date;
  eventsMap: Map<number, CalendarEvent[]>;
}

function CalendarGrid({ currentDate, eventsMap }: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {monthName}
      </h3>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded-lg border ${
              day === null
                ? 'bg-muted border-slate-100'
                : 'border-border bg-card hover:bg-muted'
            } p-1`}
          >
            {day !== null && (
              <div className="flex flex-col h-full">
                <p className="text-xs font-medium text-foreground">{day}</p>
                {eventsMap.has(day) && (
                  <div className="mt-1 flex-1 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [eventType, setEventType] =
    useState<CalendarEventType>('task-deadline');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const { data: events = [], isLoading, error } = useCalendarEventsByRange(
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  const createEventMutation = useCreateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  const eventsForMonth = events.filter((event) => {
    const eventDate = new Date(event.startsAt);
    return eventDate.getMonth() === currentDate.getMonth();
  });

  const eventsMap = new Map<number, CalendarEvent[]>();
  eventsForMonth.forEach((event) => {
    const day = new Date(event.startsAt).getDate();
    if (!eventsMap.has(day)) {
      eventsMap.set(day, []);
    }
    eventsMap.get(day)!.push(event);
  });

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError('');

    createEventMutation.mutate(
      {
        title,
        eventType,
        startsAt,
        endsAt: endsAt || undefined,
        description: description || undefined
      },
      {
        onSuccess: () => {
          setTitle('');
          setEventType('task-deadline');
          setStartsAt('');
          setEndsAt('');
          setDescription('');
        },
        onError: (exception: any) => {
          setFormError(
            exception instanceof CalendarApiError
              ? exception.message
              : 'Unable to create calendar event right now.'
          );
        }
      }
    );
  }

  function handleDeleteEvent(eventId: string) {
    deleteEventMutation.mutate(eventId, {
      onError: (exception: any) => {
        // Handle error globally or show toast
        console.error('Unable to delete event', exception);
      }
    });
  }

  function previousMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-4xl border border-border p-8 shadow-sm shadow-sm bg-card text-card-foreground">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Phase 3
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Calendar & Planning
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Track deadlines, events, and milestones across your execution
              timeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tasks"
              className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:bg-muted"
            >
              View tasks
            </Link>
            <Link
              href="/"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
          <h2 className="text-xl font-semibold">Error Loading Events</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-900/80">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <form
          className="rounded-3xl border border-border bg-card p-6 shadow-sm shadow-sm h-fit"
          onSubmit={handleCreateEvent}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              New Event
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Add to Calendar
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Event title"
                minLength={3}
                maxLength={140}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Type
              </span>
              <select
                value={eventType}
                onChange={(event) =>
                  setEventType(event.target.value as CalendarEventType)
                }
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </span>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                End (optional)
              </span>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-24 w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Add details"
                maxLength={1000}
              />
            </label>

            {formError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={createEventMutation.isPending}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createEventMutation.isPending ? 'Adding to calendar...' : 'Add to calendar'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={previousMonth}
              className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              ← Previous
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-border/80 bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Next →
            </button>
          </div>

          <CalendarGrid currentDate={currentDate} eventsMap={eventsMap} />

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">
              Events for{' '}
              {currentDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading events...</p>
            ) : (
              <EventList events={eventsForMonth} onDelete={handleDeleteEvent} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

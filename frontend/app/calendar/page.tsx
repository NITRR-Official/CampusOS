'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { clearAuthSession, readAccessToken } from '@/lib/auth-session';
import {
  CalendarApiError,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEventsByRange,
  type CalendarEvent,
  type CalendarEventType
} from '@/lib/calendar-api';

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
        <p className="text-sm text-slate-500">No events for this period.</p>
      ) : (
        events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {event.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(event.startsAt)} {formatTime(event.startsAt)}
                </p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-2"
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
                ? 'bg-slate-50 border-slate-100'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            } p-1`}
          >
            {day !== null && (
              <div className="flex flex-col h-full">
                <p className="text-xs font-medium text-slate-900">{day}</p>
                {eventsMap.has(day) && (
                  <div className="mt-1 flex-1 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
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

export default function CalendarPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] =
    useState<CalendarEventType>('task-deadline');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAccessToken(readAccessToken());
  }, []);

  useEffect(() => {
    async function loadEvents(currentToken: string) {
      setIsLoading(true);
      setError('');

      try {
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

        const items = await fetchCalendarEventsByRange(
          currentToken,
          monthStart.toISOString(),
          monthEnd.toISOString()
        );
        setEvents(items);
      } catch (exception) {
        if (exception instanceof CalendarApiError && exception.status === 401) {
          clearAuthSession();
          setAccessToken(null);
          setError('Your session expired. Please log in again.');
          return;
        }

        setError(
          exception instanceof CalendarApiError
            ? exception.message
            : 'Unable to load calendar events right now.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      void loadEvents(accessToken);
    } else {
      setIsLoading(false);
    }
  }, [accessToken, currentDate]);

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

    if (!accessToken) {
      setError('Please log in to create calendar events.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createCalendarEvent(accessToken, {
        title,
        eventType,
        startsAt,
        endsAt: endsAt || undefined,
        description: description || undefined
      });

      setTitle('');
      setEventType('task-deadline');
      setStartsAt('');
      setEndsAt('');
      setDescription('');

      // Reload events for the month
      if (accessToken) {
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
        const items = await fetchCalendarEventsByRange(
          accessToken,
          monthStart.toISOString(),
          monthEnd.toISOString()
        );
        setEvents(items);
      }
    } catch (exception) {
      setError(
        exception instanceof CalendarApiError
          ? exception.message
          : 'Unable to create calendar event right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!accessToken) return;

    try {
      await deleteCalendarEvent(accessToken, eventId);
      setEvents((current) => current.filter((e) => e.id !== eventId));
    } catch (exception) {
      setError(
        exception instanceof CalendarApiError
          ? exception.message
          : 'Unable to delete event right now.'
      );
    }
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
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-4xl border border-slate-200 p-8 shadow-sm shadow-slate-200/60 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
                Phase 3
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Calendar & Planning
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Track deadlines, events, and milestones across your execution
                timeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/tasks"
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                View tasks
              </Link>
              <Link
                href="/"
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>

        {!accessToken ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="text-xl font-semibold">Sign in required</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Log in to create and manage calendar events. Your session is
              stored locally.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900"
            >
              Go to login
            </Link>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <form
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 h-fit"
            onSubmit={handleCreateEvent}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                New Event
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Add to Calendar
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Title
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Event title"
                  minLength={3}
                  maxLength={140}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </span>
                <select
                  value={eventType}
                  onChange={(event) =>
                    setEventType(event.target.value as CalendarEventType)
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start
                </span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End (optional)
                </span>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-24 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Add details"
                  maxLength={1000}
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!accessToken || isSubmitting}
                className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Adding to calendar...' : 'Add to calendar'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={previousMonth}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Previous
              </button>
              <button
                onClick={nextMonth}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Next →
              </button>
            </div>

            <CalendarGrid currentDate={currentDate} eventsMap={eventsMap} />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">
                Events for{' '}
                {currentDate.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
              {isLoading ? (
                <p className="text-sm text-slate-500">Loading events...</p>
              ) : (
                <EventList
                  events={eventsForMonth}
                  onDelete={handleDeleteEvent}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

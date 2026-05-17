'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';
import { readAccessToken, clearAuthSession } from '@/lib/auth-session';
import { fetchEvents, EventItem, EventApiError } from '@/lib/event-api';
import {
  getCheckInStatus,
  CheckInRecord,
  CheckInApiError
} from '@/lib/checkin-api';

interface UserEventWithCheckIn extends EventItem {
  checkInStatus?: CheckInRecord;
  checkInError?: string;
}

export default function ParticipantDashboard() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEventWithCheckIn[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAccessToken(readAccessToken());
  }, []);

  useEffect(() => {
    async function loadEventsAndCheckInStatus(currentToken: string) {
      setIsLoading(true);
      setError('');

      try {
        // Fetch registered events
        const userEvents = await fetchEvents();

        // Fetch check-in status for each event
        const eventsWithCheckIn = await Promise.all(
          userEvents.map(async (event: EventItem) => {
            try {
              const checkInStatus = await getCheckInStatus(
                currentToken,
                event.id,
                ''
              );
              return { ...event, checkInStatus };
            } catch (err) {
              // No check-in yet is not an error for participants
              if (err instanceof CheckInApiError && err.status === 404) {
                return { ...event, checkInError: 'Not checked in yet' };
              }
              return event;
            }
          })
        );

        setEvents(eventsWithCheckIn);
      } catch (exception) {
        if (exception instanceof EventApiError && exception.status === 401) {
          clearAuthSession();
          setAccessToken(null);
          setError('Your session expired. Please log in again.');
          return;
        }

        setError(
          exception instanceof EventApiError
            ? exception.message
            : 'Unable to load events right now.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken) {
      void loadEventsAndCheckInStatus(accessToken);
    } else {
      setIsLoading(false);
    }
  }, [accessToken]);

  const upcomingEvents = events.filter(
    (e) => new Date(e.startsAt) > new Date()
  );
  const pastEvents = events.filter((e) => new Date(e.startsAt) <= new Date());
  const checkedInCount = events.filter(
    (e) => e.checkInStatus?.status === 'checked-in'
  ).length;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <section
          className="rounded-4xl border border-slate-200 p-8 shadow-sm shadow-slate-200/60"
          style={{
            background:
              'radial-gradient(circle at top left, rgba(34, 211, 238, 0.18), transparent 34%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
          }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
                Participant
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                My Events
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                View your registered events and check-in status.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Total Events', value: events.length },
              { label: 'Upcoming', value: upcomingEvents.length },
              { label: 'Checked In', value: checkedInCount }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {!accessToken ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="text-xl font-semibold">Sign in required</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900/80">
              Log in to view your registered events and check-in status.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-900"
            >
              Go to login
            </Link>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <p className="text-sm text-rose-700">{error}</p>
          </section>
        ) : null}

        {isLoading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-600">Loading your events...</p>
          </section>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-950">
                  Upcoming Events
                </h2>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {event.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {event.description}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            📅 {new Date(event.startsAt).toLocaleDateString()}{' '}
                            at{' '}
                            {new Date(event.startsAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/events/${event.id}`}
                            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                          >
                            View Event
                          </Link>
                          {event.checkInStatus?.status === 'checked-in' ? (
                            <span className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                              ✓ Checked In
                            </span>
                          ) : (
                            <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                              ⟳ Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-950">
                  Past Events
                </h2>
                <div className="space-y-3">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-white/50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {event.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {event.description}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            📅 {new Date(event.startsAt).toLocaleDateString()}
                          </p>
                        </div>
                        {event.checkInStatus?.status === 'checked-in' ? (
                          <span className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                            ✓ Attended
                          </span>
                        ) : (
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            ⊘ Absent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {events.length === 0 && (
              <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-slate-600">No registered events yet.</p>
                <Link
                  href="/events"
                  className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Browse Events
                </Link>
              </section>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

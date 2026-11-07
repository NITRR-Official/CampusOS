/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { useAuth } from '@campus-os/shared/auth-provider';
import {
  readAccessToken,
  clearAuthSession
} from '@campus-os/shared/auth-session';
import {
  fetchEvents,
  EventItem,
  EventApiError
} from '@plugins/event/frontend/api';
import {
  getCheckInStatus,
  CheckInRecord,
  CheckInApiError
} from '@plugins/checkin/frontend/api';
import { QRCodeVisual } from '@/components/qr/QRCodeVisual';

interface UserEventWithCheckIn extends EventItem {
  checkInStatus?: CheckInRecord;
  checkInError?: string;
}

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<UserEventWithCheckIn[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setAccessToken(readAccessToken());
  }, []);

  useEffect(() => {
    async function loadEventsAndCheckInStatus(currentToken: string) {
      setIsLoading(true);
      setError('');

      try {
        // Fetch all registered events for current user
        const userEvents = await fetchEvents({ myEvents: true }, currentToken);

        // Fetch check-in status for each event using actual user.id
        const eventsWithCheckIn = await Promise.all(
          userEvents.map(async (event: EventItem) => {
            const eventId = event.id || (event as any)._id;
            if (!eventId || !user?.id) {
              return event;
            }

            try {
              const checkInStatus = await getCheckInStatus(eventId, user.id);
              return { ...event, checkInStatus };
            } catch (err: any) {
              if (err instanceof CheckInApiError && err.status === 404) {
                return { ...event, checkInError: 'Not checked in yet' };
              }
              return event;
            }
          })
        );

        setEvents(eventsWithCheckIn);
      } catch (exception: unknown) {
        if (exception instanceof EventApiError && exception.status === 401) {
          clearAuthSession();
          setAccessToken(null);
          setError('Your session expired. Please log in again.');
          return;
        }

        setError(
          exception instanceof EventApiError
            ? exception.message
            : 'Unable to load your registered events right now.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (accessToken && user) {
      void loadEventsAndCheckInStatus(accessToken);
    } else if (!accessToken) {
      setIsLoading(false);
    }
  }, [accessToken, user]);

  const upcomingEvents = events.filter(
    (e) => new Date(e.startsAt) > new Date()
  );
  const pastEvents = events.filter((e) => new Date(e.startsAt) <= new Date());
  const checkedInCount = events.filter(
    (e) => e.checkInStatus?.status === 'checked-in'
  ).length;

  function copyPassCode(passCode: string, id: string) {
    navigator.clipboard.writeText(passCode);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Header Section */}
      <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Ticket className="size-3.5" />
              Student Pass Portal
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              My Events & Digital Passes
            </h1>
            <p className="mt-2 max-w-2xl text-sm md:text-base leading-relaxed text-muted-foreground">
              Access your confirmed event registrations, digital passes, and
              check-in QR codes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Browse All Events
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Total Registrations', value: events.length },
            { label: 'Upcoming Events', value: upcomingEvents.length },
            { label: 'Verified Attendances', value: checkedInCount }
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-muted/20 p-4 transition hover:bg-muted/30"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {!accessToken ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 p-6 text-amber-950 dark:text-amber-100">
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
            Please log in to view your registered events and digital entrance
            passes.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-xl bg-amber-950 dark:bg-amber-100 px-4 py-2 text-sm font-semibold text-white dark:text-amber-950 transition hover:opacity-90"
          >
            Go to login
          </Link>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/60 p-4">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground animate-pulse">
            Loading your digital passes...
          </p>
        </section>
      ) : (
        <>
          {/* Upcoming Events Passes */}
          {upcomingEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Ticket className="size-5 text-primary" />
                  Upcoming Event Passes ({upcomingEvents.length})
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {upcomingEvents.map((event) => {
                  const eventId = event.id || (event as any)._id;
                  const qrPassCode =
                    event.checkInStatus?.qrCode ||
                    `${eventId}-${user?.id || 'pass'}`;
                  const isCheckedIn =
                    event.checkInStatus?.status === 'checked-in';
                  const formattedDate = new Date(
                    event.startsAt
                  ).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const formattedTime = new Date(
                    event.startsAt
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={eventId}
                      className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:shadow-md hover:border-primary/40"
                    >
                      {/* Ticket Top Ribbon */}
                      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Digital Attendance Pass
                        </span>
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" /> Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            ⟳ Ready for Check-in
                          </span>
                        )}
                      </div>

                      <div className="p-6 space-y-5">
                        {/* Event Title & Details */}
                        <div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-primary shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="size-4 text-primary shrink-0" />
                            <span>{formattedTime}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="size-4 text-primary shrink-0" />
                            <span className="truncate">
                              {event.venue || 'To be announced'}
                            </span>
                          </div>
                        </div>

                        {/* Digital Ticket Pass Stub */}
                        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                              <QrCode className="size-3.5" /> Pass Code
                            </div>
                            <p className="font-mono text-sm font-bold tracking-wider text-foreground truncate">
                              {qrPassCode.substring(0, 16).toUpperCase()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Present at the check-in desk upon entry
                            </p>
                          </div>

                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <QRCodeVisual value={qrPassCode} size={84} />
                            <button
                              type="button"
                              onClick={() => copyPassCode(qrPassCode, eventId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted transition"
                              title="Copy Pass Code"
                            >
                              {copiedId === eventId ? (
                                <>
                                  <Check className="size-3 text-emerald-500" />{' '}
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-2 flex items-center justify-between border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            Attendee:{' '}
                            <strong className="text-foreground">
                              {user?.name}
                            </strong>
                          </span>
                          <Link
                            href={`/events/${eventId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Event Details <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section className="space-y-4 pt-6">
              <h2 className="text-xl font-bold text-foreground">
                Past Attended Events
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pastEvents.map((event) => {
                  const eventId = event.id || (event as any)._id;
                  const isCheckedIn =
                    event.checkInStatus?.status === 'checked-in';

                  return (
                    <div
                      key={eventId}
                      className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {event.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            📅 {new Date(event.startsAt).toLocaleDateString()}
                          </p>
                        </div>
                        {isCheckedIn ? (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ Attended
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            Not Checked In
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {events.length === 0 && (
            <section className="rounded-3xl border border-dashed border-border/80 bg-muted/30 p-12 text-center space-y-4">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Ticket className="size-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  No Registered Events Yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  Browse exciting campus events, hackathons, and workshops
                  organized by university clubs and register to get your digital
                  entrance pass.
                </p>
              </div>
              <Link
                href="/events"
                className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Explore Events
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}

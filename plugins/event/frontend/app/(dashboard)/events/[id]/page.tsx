'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  Share2
} from 'lucide-react';
import { apiClient } from '@campus-os/shared/api-client';
import { useAuth } from '@campus-os/shared/auth-provider';
import {
  Badge,
  Button,
  Skeleton,
  Card,
  CardContent,
  useToast
} from '@campusos/design-system';

interface PublicEvent {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  venue: string;
  capacity: number;
  startsAt: string;
  endsAt?: string;
  club?: {
    name: string;
    slug: string;
  };
  registrationsCount?: number;
}

export default function PublicEventDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await apiClient.get<unknown>(
          `/events/${eventId}/public`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resData = response as any;
        if (resData && resData.data) {
          setEvent(resData.data);
        } else {
          setEvent(resData);
        }
      } catch (err) {
        toast({
          title: 'Event not found',
          description: 'The event might have been unpublished or removed.',
          variant: 'destructive'
        });
        router.push('/events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId, router, toast]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to events
        </Button>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-8 mt-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-2 mt-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div>
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const startDate = new Date(event.startsAt);
  const endDate = event.endsAt ? new Date(event.endsAt) : null;
  const isPast = startDate.getTime() < new Date().getTime(); // eslint-disable-line react-hooks/purity
  const seatsLeft = event.capacity
    ? Math.max(0, event.capacity - (event.registrationsCount || 0))
    : null;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Button
        variant="ghost"
        className="mb-6 hover:bg-transparent -ml-4 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to events
        </Link>
      </Button>

      {/* Hero Banner */}
      <div className="h-64 md:h-80 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-background rounded-3xl mb-8 flex flex-col items-center justify-center border border-border/50 text-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

        {event.club && (
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-background/60 backdrop-blur-md px-4 py-2 rounded-full border border-border/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              {event.club.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-semibold text-sm">By {event.club.name}</span>
          </div>
        )}

        <div className="relative z-10 space-y-4 max-w-3xl mt-8">
          <Badge
            variant="outline"
            className="bg-background/80 backdrop-blur-sm border-primary/20 text-primary"
          >
            {startDate.toLocaleString('default', {
              month: 'long',
              year: 'numeric'
            })}
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight line-clamp-2">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              About the Event
            </h2>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
              {event.description || 'No description provided.'}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-md">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Date
                  </h4>
                  <p className="font-semibold text-foreground">
                    {startDate.toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Time
                  </h4>
                  <p className="font-semibold text-foreground">
                    {startDate.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {endDate &&
                      ` - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Venue
                  </h4>
                  <p className="font-semibold text-foreground">
                    {event.venue || 'To be announced'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg text-primary shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Availability
                  </h4>
                  <p className="font-semibold text-foreground mb-3">
                    {event.capacity ? (
                      <span>
                        {seatsLeft! > 0 ? (
                          <span className="text-green-600 dark:text-green-500">
                            {seatsLeft} seats left
                          </span>
                        ) : (
                          <span className="text-destructive">Fully Booked</span>
                        )}
                        <span className="text-muted-foreground font-normal ml-1">
                          of {event.capacity} total
                        </span>
                      </span>
                    ) : (
                      'Open to all (No limit)'
                    )}
                  </p>

                  {/* Stacked avatars for registrations */}
                  {event.registrationsCount !== undefined && (
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {Array.from({
                          length: Math.min(event.registrationsCount, 4)
                        }).map((_, i) => (
                          <div
                            key={i}
                            style={{ zIndex: 4 - i }}
                            className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white relative shadow-sm
                            ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          >
                            {String.fromCharCode(65 + (i % 26))}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {event.registrationsCount > 0
                          ? `${event.registrationsCount} student${event.registrationsCount > 1 ? 's' : ''} joined`
                          : 'Be the first to join!'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                {isPast ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Event has ended
                  </Button>
                ) : isRegistered ? (
                  <Button
                    variant="secondary"
                    className="w-full text-green-500"
                    disabled
                  >
                    ✓ You are registered
                  </Button>
                ) : seatsLeft === 0 ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Fully Booked
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12 text-lg shadow-lg hover:shadow-primary/25 transition-all"
                    onClick={async () => {
                      if (!user) {
                        router.push(`/login?redirect=/events/${eventId}`);
                        return;
                      }
                      setRegistering(true);
                      try {
                        const payload = {
                          attendeeName: user.name,
                          attendeeEmail: user.email
                        };
                        await apiClient.post(
                          `/events/${eventId}/registrations`,
                          payload
                        );
                        toast({
                          title: 'Success!',
                          description:
                            'You have been registered for this event.'
                        });
                        setIsRegistered(true);
                        setEvent((prev) =>
                          prev
                            ? {
                                ...prev,
                                registrationsCount:
                                  (prev.registrationsCount || 0) + 1
                              }
                            : prev
                        );
                      } catch (err: unknown) {
                        const error = err as {
                          response?: { data?: { code?: string } };
                        };
                        if (
                          error.response?.data?.code === 'ALREADY_REGISTERED'
                        ) {
                          setIsRegistered(true);
                          toast({
                            title: 'Already registered',
                            description:
                              'You are already registered for this event.',
                            variant: 'default'
                          });
                        } else if (
                          error.response?.data?.code ===
                          'EVENT_CAPACITY_REACHED'
                        ) {
                          toast({
                            title: 'Capacity reached',
                            description: 'This event is now fully booked.',
                            variant: 'destructive'
                          });
                        } else {
                          toast({
                            title: 'Registration failed',
                            description: 'Please try again later.',
                            variant: 'destructive'
                          });
                        }
                      } finally {
                        setRegistering(false);
                      }
                    }}
                    disabled={registering}
                  >
                    {registering ? 'Registering...' : 'Register Now'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: 'Link copied',
                      description: 'Event link copied to clipboard.'
                    });
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

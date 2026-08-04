'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Search } from 'lucide-react';
import { apiClient } from '@campus-os/shared/api-client';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Input
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

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'available' | 'past' | 'all'>(
    'available'
  );

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await apiClient.get<unknown>('/events/public');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resData = response as any;
        if (resData && resData.data) {
          setEvents(resData.data);
        } else if (Array.isArray(resData)) {
          setEvents(resData);
        }
      } catch (err) {
        console.error('Failed to load public events', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    // 1. Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(searchLower) ||
      (event.description &&
        event.description.toLowerCase().includes(searchLower)) ||
      (event.club && event.club.name.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // 2. Status filter
    const now = new Date().getTime();
    const startTime = new Date(event.startsAt).getTime();
    const endTime = event.endsAt ? new Date(event.endsAt).getTime() : startTime;

    if (filterType === 'available') {
      return endTime >= now;
    } else if (filterType === 'past') {
      return endTime < now;
    }

    return true; // 'all'
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Events
          </h1>
          <p className="text-muted-foreground">
            Discover workshops, cultural fests, hackathons, and activities
            happening across the campus.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-muted/50 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setFilterType('available')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'available' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Available
            </button>
            <button
              onClick={() => setFilterType('past')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'past' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Past
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
          <div className="bg-muted p-4 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground max-w-md">
            {searchQuery
              ? `We couldn't find any events matching "${searchQuery}". Try adjusting your filters or search terms.`
              : 'There are currently no events matching this filter. Check back later for new activities!'}
          </p>
          {(searchQuery || filterType !== 'all') && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const startDate = new Date(event.startsAt);
            const id = event.id || event._id;
            return (
              <Link
                key={id}
                href={`/events/${id}`}
                className="group block h-full"
              >
                <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-md border-border/60 hover:border-primary/50 relative">
                  {/* Fading Banner spanning till title */}
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:12px_12px] opacity-30" />
                  </div>

                  <CardHeader className="pt-20 pb-4 flex-col space-y-3 relative z-10">
                    {/* Club Logo */}
                    <div className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center text-primary font-bold text-sm border border-border shadow-sm">
                      {event.club?.name
                        ? event.club.name.substring(0, 2).toUpperCase()
                        : 'CO'}
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col flex-1 gap-1.5 pt-1">
                        <CardTitle className="line-clamp-2 text-lg leading-tight">
                          {event.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1 text-sm">
                          {event.description ||
                            'Join us for this exciting campus event.'}
                        </CardDescription>
                      </div>

                      {/* Date Block on the Right */}
                      <div className="flex flex-col items-center justify-center min-w-[52px] min-h-[52px] rounded-lg bg-background/60 backdrop-blur-sm border border-border p-2 shrink-0 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {startDate.toLocaleString('default', {
                            month: 'short'
                          })}
                        </span>
                        <span className="text-xl font-black text-foreground leading-none mt-0.5">
                          {startDate.getDate()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="mt-auto space-y-4 pt-4 border-t border-border/30 relative z-10">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {/* Location on Left */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {event.venue || 'TBA'}
                        </span>
                      </div>
                      {/* Time on Right (below date) */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>
                          {startDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Stacked Avatars for Registrations */}
                    {event.registrationsCount !== undefined && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex -space-x-2">
                          {Array.from({
                            length: Math.min(event.registrationsCount, 3)
                          }).map((_, i) => (
                            <div
                              key={i}
                              style={{ zIndex: 3 - i }}
                              className={`w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white relative
                                ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : 'bg-emerald-500'}`}
                            >
                              {String.fromCharCode(65 + (i % 26))}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {event.registrationsCount > 0
                            ? `${event.registrationsCount}${event.capacity ? `/${event.capacity}` : ''} registered`
                            : 'Be the first to register'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

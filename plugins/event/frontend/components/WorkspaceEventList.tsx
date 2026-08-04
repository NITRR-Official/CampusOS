'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@campusos/design-system';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Sparkles,
  Plus,
  Search
} from 'lucide-react';
import { useMyClubPermissions } from '@plugins/club/frontend/hooks';
import type { EventItem } from '../api';

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function WorkspaceEventList({
  events,
  clubId
}: {
  events: EventItem[];
  clubId: string;
}) {
  const { data: permissionsData } = useMyClubPermissions(clubId);
  const canCreate =
    permissionsData?.permissions?.includes('event:create') ||
    permissionsData?.permissions?.includes('*') ||
    permissionsData?.isSuperAdmin;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'available' | 'past' | 'all'>(
    'all'
  );

  const filteredEvents = events.filter((event) => {
    // 1. Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(searchLower) ||
      (event.description &&
        event.description.toLowerCase().includes(searchLower));

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
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 md:p-12 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full opacity-60 translate-x-1/3 -translate-y-1/3" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
            <Sparkles className="size-4" />
            Events Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Manage Events
          </h1>
          <p className="text-lg text-muted-foreground">
            Create and organize events for your club. Manage registrations, set
            capacities, and publish activities.
          </p>
          {canCreate && (
            <div className="flex flex-wrap gap-4 mt-6">
              <Button size="lg" asChild className="gap-2">
                <Link href={`/workspace/${clubId}/events/new`}>
                  <Plus className="size-4" />
                  Create New Event
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
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
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('available')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'available' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Upcoming/Active
          </button>
          <button
            onClick={() => setFilterType('past')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'past' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Past
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-12 text-center text-muted-foreground">
            {searchQuery || filterType !== 'all'
              ? 'No events found matching your filters.'
              : 'No events created yet.'}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Link
              key={event.id || event._id}
              href={`/workspace/${clubId}/events/${event.id || event._id}`}
              className="group block"
            >
              <article className="flex flex-col h-full rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
                {/* Event Image/Banner Placeholder */}
                <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:14px_14px]" />
                  <div className="absolute top-4 right-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                        event.status === 'published'
                          ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${event.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
                      {event.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-6">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                    {event.title}
                  </h2>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                    {event.description ||
                      'No description available for this event.'}
                  </p>

                  <div className="space-y-3 mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <CalendarIcon className="size-4 mr-2 text-primary/70" />
                      {formatDate(event.startsAt)}
                    </div>
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                      <MapPin className="size-4 mr-2 text-primary/70" />
                      <span className="truncate">
                        {event.venue || 'Venue TBA'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-4 text-primary/70" />
                        {(event as any).registrationsCount ||
                          event.registrations?.length ||
                          0}{' '}
                        / {event.capacity || '∞'} Attending
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-1 transition-transform">
                        Manage <span aria-hidden="true">&rarr;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

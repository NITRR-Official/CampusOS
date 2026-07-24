import React, { useEffect, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { API_BASE_URL } from '@campus-os/shared/api-client';

export function EventStatsWidget() {
  return (
    <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 text-2xl min-w-fit">
        <Calendar className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
          Events
        </p>
        <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">0</p>
      </div>
    </div>
  );
}

export function EventQuickActionWidget() {
  return (
    <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-colors">
        <Plus className="h-6 w-6" />
      </div>
      <span className="relative text-sm font-semibold tracking-wide text-foreground">
        Schedule Event
      </span>
    </button>
  );
}

export function EventActivityWidget() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/events/public`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.data?.slice(0, 3) || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch events for activity feed:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Loading recent events...
      </div>
    );
  }

  if (events.length === 0) {
    return null; // Let the dashboard be empty or handled by other plugins
  }

  return (
    <>
      {events.map((event, index) => (
        <div
          key={event._id || event.id || index}
          className="bg-card/80 backdrop-blur rounded-xl border border-border/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground m-0">
              {event.title || event.name || 'Upcoming Event'}
            </p>
            <p className="text-sm text-muted-foreground m-0 mt-0.5">
              Scheduled for{' '}
              {new Date(
                event.startDate || event.createdAt
              ).toLocaleDateString()}
            </p>
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
            Event
          </span>
        </div>
      ))}
    </>
  );
}

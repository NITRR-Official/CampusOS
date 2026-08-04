/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@campus-os/shared/api-client';
import { fetchClubs } from '@plugins/club/frontend/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Skeleton,
  useToast
} from '@campusos/design-system';

interface CampusEvent {
  _id?: string;
  id?: string;
  title: string;
  clubId: string;
  status: string;
  startsAt: string;
  endsAt?: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [clubs, setClubs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const { toast } = useToast();

  async function loadData() {
    try {
      setLoading(true);
      const [eventsData, approvedClubs, pendingClubs] = await Promise.all([
        apiClient.get<any>('/admin/events').catch(() => []),
        fetchClubs('approved').catch(() => []),
        fetchClubs('pending').catch(() => [])
      ]);

      if (Array.isArray(eventsData)) {
        setEvents(eventsData);
      } else if (eventsData && Array.isArray(eventsData.data)) {
        setEvents(eventsData.data);
      } else {
        setEvents([]);
      }

      const allClubs = [...approvedClubs, ...pendingClubs];
      const clubMap: Record<string, string> = {};
      allClubs.forEach((c: any) => {
        clubMap[c._id || c.id] = c.name;
      });
      setClubs(clubMap);
    } catch (err: any) {
      toast({
        title: 'Failed to load data',
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleTogglePublish(eventId: string, isPublished: boolean) {
    setActionLoading(eventId);
    try {
      const endpoint = isPublished ? 'unpublish' : 'publish';
      await apiClient.post(`/events/${eventId}/${endpoint}`, {});
      toast({
        title: 'Success',
        description: `Event has been ${isPublished ? 'unpublished' : 'published'}.`
      });
      setEvents((prev) =>
        prev.map((e) =>
          (e.id || e._id) === eventId
            ? { ...e, status: isPublished ? 'draft' : 'published' }
            : e
        )
      );
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err.message || 'Failed to update event status',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Platform Events
        </h2>
        <p className="text-sm text-muted-foreground">
          Monitor and moderate all events created across the campus.
        </p>
      </div>

      <div className="border border-border/50 rounded-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Event Title</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Starts At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-[100px] ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No events found.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => {
                const id = event.id || event._id || '';
                const isPublished = event.status === 'published';
                return (
                  <TableRow
                    key={id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {clubs[event.clubId] || event.clubId}
                    </TableCell>
                    <TableCell>
                      {isPublished ? (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-200 bg-green-50"
                        >
                          Published
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-200 bg-amber-50"
                        >
                          {event.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(event.startsAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(id, isPublished);
                        }}
                        disabled={actionLoading === id}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
                      >
                        {isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-card border border-border shadow-lg rounded-xl w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">Event Details</h3>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Title</div>
                <div className="col-span-2 font-medium">
                  {selectedEvent.title}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Club</div>
                <div className="col-span-2">
                  {clubs[selectedEvent.clubId] || selectedEvent.clubId}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Status</div>
                <div className="col-span-2 capitalize">
                  {selectedEvent.status}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Starts At</div>
                <div className="col-span-2">
                  {new Date(selectedEvent.startsAt).toLocaleString()}
                </div>
              </div>
              {selectedEvent.endsAt && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-muted-foreground">Ends At</div>
                  <div className="col-span-2">
                    {new Date(selectedEvent.endsAt).toLocaleString()}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-muted-foreground">Internal ID</div>
                <div className="col-span-2 text-xs font-mono">
                  {selectedEvent.id || selectedEvent._id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

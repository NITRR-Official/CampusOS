/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@campus-os/shared/api-client';
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await apiClient.get<any>('/admin/events');
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data && Array.isArray(data.data)) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load events',
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
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
              <TableHead>Club ID</TableHead>
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
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.clubId}
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
                        onClick={() => handleTogglePublish(id, isPublished)}
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
    </div>
  );
}

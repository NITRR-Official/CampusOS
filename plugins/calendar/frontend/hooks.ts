import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllCalendarEvents,
  fetchCalendarEventsByRange,
  createCalendarEvent,
  deleteCalendarEvent,
  CalendarEventType
} from './api';

export function useAllCalendarEvents() {
  return useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: fetchAllCalendarEvents,
  });
}

export function useCalendarEventsByRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['calendar', 'events', 'range', startDate, endDate],
    queryFn: () => fetchCalendarEventsByRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      title: string;
      eventType: CalendarEventType;
      startsAt: string;
      endsAt?: string;
      description?: string;
      linkedTaskId?: string;
      linkedEventId?: string;
    }) => createCalendarEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => deleteCalendarEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
    },
  });
}

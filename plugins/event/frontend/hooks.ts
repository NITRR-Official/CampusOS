import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEventById, fetchEvents, registerForEvent } from './api';

export function useEvents(clubId: string) {
  return useQuery({
    queryKey: ['events', clubId],
    queryFn: () => fetchEvents({ clubId }),
    enabled: !!clubId
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => fetchEventById(eventId),
    enabled: !!eventId
  });
}

export function useRegisterForEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { attendeeName: string; attendeeEmail: string }) =>
      registerForEvent(eventId, payload),
    onSuccess: () => {
      // Invalidate the specific event to fetch the new registration
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}

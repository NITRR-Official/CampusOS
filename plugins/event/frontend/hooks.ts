import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@campus-os/shared/api-client';
import { fetchEventById, fetchEvents, registerForEvent } from './api';

export function useClubPermissions(clubId: string) {
  return useQuery({
    queryKey: ['club-permissions', clubId],
    queryFn: async () => {
      try {
        return await apiClient.get<{
          permissions: string[];
          isSuperAdmin?: boolean;
        }>(`/clubs/${clubId}/my-permissions`);
      } catch {
        return { permissions: [], isSuperAdmin: false };
      }
    },
    enabled: !!clubId
  });
}

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
    mutationFn: (payload: {
      attendeeName: string;
      attendeeEmail: string;
      customResponses?: Record<string, any>;
    }) => registerForEvent(eventId, payload),
    onSuccess: () => {
      // Invalidate the specific event to fetch the new registration
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}

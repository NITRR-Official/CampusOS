import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCheckIns,
  createCheckIn,
  getCheckInStatus,
  scanQRCode,
  fetchAttendanceStats
} from './api';

export function useEventCheckIns(eventId: string) {
  return useQuery({
    queryKey: ['checkins', 'event', eventId],
    queryFn: () => fetchCheckIns(eventId),
    enabled: !!eventId
  });
}

export function useUserCheckInStatus(eventId: string, userId: string) {
  return useQuery({
    queryKey: ['checkins', 'status', eventId, userId],
    queryFn: () => getCheckInStatus(eventId, userId),
    enabled: !!eventId && !!userId
  });
}

export function useEventAttendanceStats(eventId: string) {
  return useQuery({
    queryKey: ['checkins', 'stats', eventId],
    queryFn: () => fetchAttendanceStats(eventId),
    enabled: !!eventId
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      createCheckIn(eventId, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['checkins', 'event', variables.eventId]
      });
      queryClient.invalidateQueries({
        queryKey: ['checkins', 'status', variables.eventId, variables.userId]
      });
      queryClient.invalidateQueries({
        queryKey: ['checkins', 'stats', variables.eventId]
      });
    }
  });
}

export function useScanQRCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (qrCode: string) => scanQRCode(qrCode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['checkins', 'event', data.eventId]
      });
      queryClient.invalidateQueries({
        queryKey: ['checkins', 'status', data.eventId, data.userId]
      });
      queryClient.invalidateQueries({
        queryKey: ['checkins', 'stats', data.eventId]
      });
    }
  });
}

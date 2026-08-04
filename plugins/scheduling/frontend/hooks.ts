import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schedulingAPI from './api';

export function useEventSchedule(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'schedule'],
    queryFn: () => schedulingAPI.getEventSchedule(eventId),
    enabled: !!eventId
  });
}

export function useTimeSlot(slotId: string) {
  return useQuery({
    queryKey: ['schedule', slotId],
    queryFn: () => schedulingAPI.getTimeSlot(slotId),
    enabled: !!slotId
  });
}

export function useAllConflicts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['schedule', 'conflicts', filters],
    queryFn: () => schedulingAPI.getAllConflicts(filters)
  });
}

export function useSlotConflicts(slotId: string) {
  return useQuery({
    queryKey: ['schedule', slotId, 'conflicts'],
    queryFn: () => schedulingAPI.getSlotConflicts(slotId),
    enabled: !!slotId
  });
}

export function useCreateTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      slotData
    }: {
      eventId: string;
      slotData: Record<string, unknown>;
    }) => schedulingAPI.createTimeSlot(eventId, slotData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['events', variables.eventId, 'schedule']
      });
    }
  });
}

export function useUpdateTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slotId,
      updateData
    }: {
      slotId: string;
      updateData: Record<string, unknown>;
    }) => schedulingAPI.updateTimeSlot(slotId, updateData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['schedule', variables.slotId]
      });
      // Invalidate event schedule too, if we had the eventId
    }
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => schedulingAPI.deleteTimeSlot(slotId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', variables] });
      // We'd ideally invalidate the parent event's schedule
    }
  });
}

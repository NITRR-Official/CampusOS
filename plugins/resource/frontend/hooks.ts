import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import resourceAPI from './api';

export function useAllResources(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: () => resourceAPI.getAllResources(filters),
  });
}

export function useAvailableResources(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['resources', 'available', filters],
    queryFn: () => resourceAPI.getAvailableResources(filters),
  });
}

export function useResource(resourceId: string) {
  return useQuery({
    queryKey: ['resources', resourceId],
    queryFn: () => resourceAPI.getResourceById(resourceId),
    enabled: !!resourceId,
  });
}

export function useEventResources(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'resources'],
    queryFn: () => resourceAPI.getEventResources(eventId),
    enabled: !!eventId,
  });
}

export function useResourceAllocations(resourceId: string) {
  return useQuery({
    queryKey: ['resources', resourceId, 'allocations'],
    queryFn: () => resourceAPI.getResourceAllocations(resourceId),
    enabled: !!resourceId,
  });
}

export function useAllocateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, resourceId, data }: { eventId: string; resourceId: string; data: Record<string, unknown> }) =>
      resourceAPI.allocateResourceToEvent(eventId, resourceId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events', variables.eventId, 'resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources', variables.resourceId, 'allocations'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

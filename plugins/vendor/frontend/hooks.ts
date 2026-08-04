import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import vendorAPI from './api';

export function useAllVendors(
  clubId: string,
  filters?: Record<string, unknown>
) {
  return useQuery({
    queryKey: ['vendors', clubId, filters],
    queryFn: () => vendorAPI.getAllVendors(clubId, filters),
    enabled: !!clubId
  });
}

export function useVendor(vendorId: string) {
  return useQuery({
    queryKey: ['vendors', vendorId],
    queryFn: () => vendorAPI.getVendorById(vendorId),
    enabled: !!vendorId
  });
}

export function useCreateVendor(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      vendorAPI.createVendor(clubId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors', clubId] });
    }
  });
}

export function useEventVendors(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'vendors'],
    queryFn: () => vendorAPI.getEventVendors(eventId),
    enabled: !!eventId
  });
}

export function useVendorAssignments(vendorId: string) {
  return useQuery({
    queryKey: ['vendors', vendorId, 'assignments'],
    queryFn: () => vendorAPI.getVendorAssignments(vendorId),
    enabled: !!vendorId
  });
}

export function useAssignVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      vendorId,
      data
    }: {
      eventId: string;
      vendorId: string;
      data: Record<string, unknown>;
    }) => vendorAPI.assignVendorToEvent(eventId, vendorId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['events', variables.eventId, 'vendors']
      });
      queryClient.invalidateQueries({
        queryKey: ['vendors', variables.vendorId, 'assignments']
      });
    }
  });
}

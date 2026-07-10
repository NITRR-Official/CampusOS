import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchClubs, 
  fetchClubBySlug, 
  fetchMyClubPermissions, 
  fetchRoles, 
  fetchSystemPermissions,
  createRole,
  updateRole,
  deleteRole,
  createClub,
  updateClub,
  approveClub,
  rejectClub
} from './api';
import type { Club, Role } from './api';

// Queries
export function useClubs(status?: 'approved' | 'pending' | 'rejected') {
  return useQuery({
    queryKey: ['clubs', { status }],
    queryFn: () => fetchClubs(status),
  });
}

export function useClub(slug: string) {
  return useQuery({
    queryKey: ['clubs', slug],
    queryFn: () => fetchClubBySlug(slug),
    enabled: !!slug,
  });
}

export function useMyClubPermissions(clubId: string) {
  return useQuery({
    queryKey: ['clubs', clubId, 'my-permissions'],
    queryFn: () => fetchMyClubPermissions(clubId),
    enabled: !!clubId,
  });
}

export function useClubRoles(clubId: string) {
  return useQuery({
    queryKey: ['clubs', clubId, 'roles'],
    queryFn: () => fetchRoles(clubId),
    enabled: !!clubId,
  });
}

export function useSystemPermissions() {
  return useQuery({
    queryKey: ['system', 'permissions'],
    queryFn: fetchSystemPermissions,
  });
}

// Mutations
export function useCreateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Club>) => createClub(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useUpdateClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clubId, payload }: { clubId: string; payload: Partial<Club> }) => updateClub(clubId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useApproveClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveClub(id),
    onSuccess: (_, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useRejectClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectClub(id),
    onSuccess: (_, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
    },
  });
}

export function useCreateRole(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Role>) => createRole(clubId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'roles'] });
    },
  });
}

export function useUpdateRole(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: Partial<Role> }) => updateRole(clubId, roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'roles'] });
      // Invalidate permissions in case the updated role affected the current user
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'my-permissions'] });
    },
  });
}

export function useDeleteRole(clubId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => deleteRole(clubId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'roles'] });
    },
  });
}

import { apiClient } from './api/client';

export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  logoUrl?: string;
  bannerUrl?: string;
  memberCount: number;
  status: 'active' | 'inactive' | 'pending' | 'rejected' | 'approved';
  createdAt: string;
}

export interface Role {
  _id: string;
  clubId: string;
  name: string;
  permissions: string[];
  hierarchyLevel: number;
  roleType: 'role' | 'team';
  color: string | null;
  isTemplate: boolean;
}

export interface SystemPermission {
  id: string;
  module: string;
  label: string;
  description: string;
}

export interface SystemPermissionGroup {
  module: string;
  permissions: SystemPermission[];
}

export async function fetchClubs(
  status?: 'active' | 'pending' | 'rejected' | 'approved'
): Promise<Club[]> {
  const query = status ? `?status=${status}` : '';
  const response = await apiClient.get<Club[]>(`/clubs${query}`);
  return response;
}

export async function fetchClubBySlug(slug: string): Promise<Club | null> {
  try {
    const clubs = await fetchClubs();
    return (
      clubs.find(
        (c: Club & { _id?: string }) =>
          c.slug === slug || c.id === slug || c._id === slug
      ) || null
    );
  } catch {
    return null;
  }
}

export async function createClub(payload: Partial<Club>): Promise<Club> {
  const response = await apiClient.post<Club>('/clubs', payload);
  return response;
}

export async function approveClub(id: string): Promise<Club> {
  const response = await apiClient.patch<Club>(`/clubs/${id}/approve`, {});
  return response;
}

export async function rejectClub(id: string): Promise<Club> {
  const response = await apiClient.patch<Club>(`/clubs/${id}/reject`, {});
  return response;
}

export async function fetchRoles(clubId: string): Promise<Role[]> {
  const response = await apiClient.get<Role[]>(`/clubs/${clubId}/roles`);
  return response;
}

export async function createRole(
  clubId: string,
  payload: Partial<Role>
): Promise<Role> {
  const response = await apiClient.post<Role>(
    `/clubs/${clubId}/roles`,
    payload
  );
  return response;
}

export async function updateRole(
  clubId: string,
  roleId: string,
  payload: Partial<Role>
): Promise<Role> {
  const response = await apiClient.patch<Role>(
    `/clubs/${clubId}/roles/${roleId}`,
    payload
  );
  return response;
}

export async function deleteRole(
  clubId: string,
  roleId: string
): Promise<boolean> {
  // delete API returns { success: true, data: { deleted: true } }
  // Our apiClient unwraps data, so it returns { deleted: true }
  const response = await apiClient.delete<{ deleted: boolean }>(
    `/clubs/${clubId}/roles/${roleId}`
  );
  return response.deleted;
}

export async function fetchSystemPermissions(): Promise<
  SystemPermissionGroup[]
> {
  // System permissions API returns { success: true, permissions: [...] }
  // It is NOT wrapped in data. So apiClient will return the full json.
  const response = await apiClient.get<{
    success: boolean;
    permissions: SystemPermissionGroup[];
  }>('/system/permissions');
  return response.permissions;
}

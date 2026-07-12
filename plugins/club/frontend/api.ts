import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

// Export for usage elsewhere
export { ApiError as ClubApiError };

export const ClubSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().nullable(),
  category: z.string(),
  email: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  memberCount: z.number().optional().default(0),
  status: z.enum([
    'active',
    'inactive',
    'pending',
    'rejected',
    'approved',
    'archived',
    'pending_verification'
  ]),
  createdAt: z.string(),
  updatedAt: z.string().optional().nullable()
});

export type Club = z.infer<typeof ClubSchema>;

export const RoleSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  clubId: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
  hierarchyLevel: z.number(),
  roleType: z.enum(['role', 'team']).default('role'),
  color: z.string().nullable().optional(),
  isTemplate: z.boolean().default(false)
});

export type Role = z.infer<typeof RoleSchema>;

export const ClubMemberSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  userId: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      name: z.string(),
      email: z.string()
    })
  ]),
  clubId: z.string(),
  roles: z.array(z.any()), // Either role objects or strings depending on backend population
  joinedAt: z.string().optional().nullable()
});

export type ClubMember = z.infer<typeof ClubMemberSchema>;

export const SystemPermissionSchema = z.object({
  id: z.string(),
  module: z.string(),
  label: z.string(),
  description: z.string()
});

export type SystemPermission = z.infer<typeof SystemPermissionSchema>;

export interface SystemPermissionGroup {
  module: string;
  permissions: SystemPermission[];
}

export const MyPermissionsSchema = z.object({
  permissions: z.array(z.string()),
  isSuperAdmin: z.boolean(),
  maxHierarchy: z.number().default(-1)
});

export async function fetchClubs(
  status?: 'approved' | 'pending' | 'rejected'
): Promise<Club[]> {
  const query = status ? `?status=${status}` : '';
  const response = await apiClient.get(`/clubs${query}`);
  return z.array(ClubSchema).parse(response);
}

export async function fetchClubBySlug(slug: string): Promise<Club | null> {
  try {
    const clubs = await fetchClubs();
    return (
      clubs.find((c) => c.slug === slug || c.id === slug || c._id === slug) ||
      null
    );
  } catch {
    return null;
  }
}

export async function createClub(payload: Partial<Club>): Promise<Club> {
  const response = await apiClient.post('/clubs', payload);
  return ClubSchema.parse(response);
}

export async function updateClub(
  clubId: string,
  payload: Partial<Club>
): Promise<Club> {
  const response = await apiClient.patch(`/clubs/${clubId}`, payload);
  return ClubSchema.parse(response);
}

export async function approveClub(id: string): Promise<Club> {
  const response = await apiClient.patch(`/clubs/${id}/approve`, {});
  return ClubSchema.parse(response);
}

export async function rejectClub(id: string): Promise<Club> {
  const response = await apiClient.patch(`/clubs/${id}/reject`, {});
  return ClubSchema.parse(response);
}

export async function fetchRoles(clubId: string): Promise<Role[]> {
  const response = await apiClient.get(`/clubs/${clubId}/roles`);
  return z.array(RoleSchema).parse(response);
}

export async function createRole(
  clubId: string,
  payload: Partial<Role>
): Promise<Role> {
  const response = await apiClient.post(`/clubs/${clubId}/roles`, payload);
  return RoleSchema.parse(response);
}

export async function updateRole(
  clubId: string,
  roleId: string,
  payload: Partial<Role>
): Promise<Role> {
  const response = await apiClient.patch(
    `/clubs/${clubId}/roles/${roleId}`,
    payload
  );
  return RoleSchema.parse(response);
}

export async function deleteRole(
  clubId: string,
  roleId: string
): Promise<boolean> {
  const response = await apiClient.delete<{ deleted: boolean }>(
    `/clubs/${clubId}/roles/${roleId}`
  );
  return response.deleted;
}

export async function fetchSystemPermissions(): Promise<
  SystemPermissionGroup[]
> {
  const response = await apiClient.get<{
    success: boolean;
    permissions: Record<string, any[]>;
  }>('/system/permissions');

  return Object.entries(response.permissions || {}).map(([module, perms]) => ({
    module,
    permissions: z.array(SystemPermissionSchema).parse(perms)
  }));
}

export async function fetchMyClubPermissions(
  clubId: string
): Promise<{
  permissions: string[];
  isSuperAdmin: boolean;
  maxHierarchy: number;
}> {
  try {
    const response = await apiClient.get(
      `/clubs/${clubId}/my-permissions?t=${Date.now()}`
    );
    return MyPermissionsSchema.parse(response);
  } catch {
    return { permissions: [], isSuperAdmin: false, maxHierarchy: -1 };
  }
}

export async function fetchClubMembers(clubId: string): Promise<ClubMember[]> {
  const response = await apiClient.get(`/clubs/${clubId}/members`);
  return z.array(ClubMemberSchema).parse(response);
}

export async function addClubMember(
  clubId: string,
  payload: { email: string; role: string }
): Promise<ClubMember> {
  const response = await apiClient.post(`/clubs/${clubId}/members`, payload);
  return ClubMemberSchema.parse(response);
}

export async function removeClubMember(
  clubId: string,
  memberUserId: string
): Promise<boolean> {
  const response = await apiClient.delete<{ removed: boolean }>(
    `/clubs/${clubId}/members/${memberUserId}`
  );
  return response.removed;
}

export async function assignClubMemberRole(
  clubId: string,
  memberUserId: string,
  roleName: string
): Promise<ClubMember> {
  const response = await apiClient.patch(
    `/clubs/${clubId}/members/${memberUserId}/role`,
    { role: roleName }
  );
  return ClubMemberSchema.parse(response);
}

export async function revokeClubMemberRole(
  clubId: string,
  memberUserId: string,
  roleName: string
): Promise<ClubMember> {
  const response = await apiClient.delete(
    `/clubs/${clubId}/members/${memberUserId}/roles/${roleName}`
  );
  return ClubMemberSchema.parse(response);
}

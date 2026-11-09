import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@campus-os/shared/api-client';

export interface WorkspaceSummary {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  logo?: string;
  status?: string;
}

export interface WorkspacePermissions {
  permissions: string[];
  isSuperAdmin: boolean;
  maxHierarchy: number;
  isMember: boolean;
}

/**
 * Core decoupled workspace permissions hook (DIP Compliance - Issue #162).
 * Allows core frontend guards to verify workspace permissions without importing plugin internals.
 */
export function useWorkspacePermissions(slugOrId?: string) {
  return useQuery<WorkspacePermissions>({
    queryKey: ['workspace-permissions', slugOrId],
    queryFn: async () => {
      if (!slugOrId) {
        return {
          permissions: [],
          isSuperAdmin: false,
          maxHierarchy: -1,
          isMember: false
        };
      }
      try {
        const response = await apiClient.get<WorkspacePermissions>(
          `/clubs/${slugOrId}/my-permissions`
        );
        return {
          permissions: Array.isArray(response?.permissions)
            ? response.permissions
            : [],
          isSuperAdmin: Boolean(response?.isSuperAdmin),
          maxHierarchy: response?.maxHierarchy ?? -1,
          isMember: Boolean(response?.isMember)
        };
      } catch {
        return {
          permissions: [],
          isSuperAdmin: false,
          maxHierarchy: -1,
          isMember: false
        };
      }
    },
    enabled: Boolean(slugOrId),
    staleTime: 60 * 1000
  });
}

/**
 * Core decoupled workspace context hook (DIP Compliance - Issue #162).
 * Queries active clubs/workspaces without directly importing concrete plugin modules.
 */
export function useWorkspaces() {
  return useQuery<WorkspaceSummary[]>({
    queryKey: ['workspaces', 'all'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<
          { clubs?: WorkspaceSummary[] } | WorkspaceSummary[]
        >('/clubs');
        if (Array.isArray(res)) return res;
        if (res && 'clubs' in res && Array.isArray(res.clubs)) return res.clubs;
        return [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000
  });
}

export default useWorkspaces;

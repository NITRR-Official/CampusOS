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

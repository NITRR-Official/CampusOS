import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { CandidateStatus } from './components/KanbanBoard';

// --- Campaigns ---
export function useCampaigns(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['campaigns', entityType, entityId],
    queryFn: () => api.getCampaigns(entityType, entityId),
    enabled: !!entityType && !!entityId
  });
}

export function useCreateCampaign(entityType: string, entityId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      onboardRoleName: string;
      formSchema: any;
    }) => api.createCampaign(entityType, entityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', entityType, entityId]
      });
    }
  });
}

// --- Candidates ---
export function useCandidates(campaignId: string | null) {
  return useQuery({
    queryKey: ['candidates', campaignId],
    queryFn: () => api.getCandidates(campaignId!),
    enabled: !!campaignId
  });
}

export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      candidateId,
      status
    }: {
      campaignId: string;
      candidateId: string;
      status: CandidateStatus;
    }) => api.updateCandidateStatus(campaignId, candidateId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['candidates', variables.campaignId]
      });
    }
  });
}

export function useUpdateCandidateNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      candidateId,
      notes
    }: {
      campaignId: string;
      candidateId: string;
      notes: string;
    }) => api.updateCandidateNotes(campaignId, candidateId, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['candidates', variables.campaignId]
      });
    }
  });
}

// --- Forms ---
export function useFormSchema(formId?: string) {
  return useQuery({
    queryKey: ['form', formId],
    queryFn: () => api.getFormSchema(formId!),
    enabled: !!formId
  });
}

export function useFormResponse(formId?: string, responseId?: string) {
  return useQuery({
    queryKey: ['form-response', formId, responseId],
    queryFn: () => api.getFormResponse(formId!, responseId!),
    enabled: !!formId && !!responseId
  });
}

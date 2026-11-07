import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFormsByEntity,
  fetchFormById,
  createForm,
  updateForm,
  submitFormResponse,
  fetchFormResponses,
  type FormEntity
} from './api';

export function useEntityForms(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['forms', entityType, entityId],
    queryFn: () => fetchFormsByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: ['forms', formId],
    queryFn: () => fetchFormById(formId),
    enabled: !!formId
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createForm,
    onSuccess: (data: FormEntity) => {
      queryClient.invalidateQueries({
        queryKey: ['forms', data.entityType, data.entityId]
      });
    }
  });
}

export function useUpdateForm(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<FormEntity>) => updateForm(formId, payload),
    onSuccess: (data: FormEntity) => {
      queryClient.invalidateQueries({ queryKey: ['forms', formId] });
      if (data?.entityType && data?.entityId) {
        queryClient.invalidateQueries({
          queryKey: ['forms', data.entityType, data.entityId]
        });
      }
    }
  });
}

export function useSubmitFormResponse(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (answers: Record<string, any>) =>
      submitFormResponse(formId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['forms', formId, 'responses']
      });
    }
  });
}

export function useFormResponses(formId: string) {
  return useQuery({
    queryKey: ['forms', formId, 'responses'],
    queryFn: () => fetchFormResponses(formId),
    enabled: !!formId
  });
}

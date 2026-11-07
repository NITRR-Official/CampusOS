import { apiClient } from '@campus-os/shared/api-client';
import type { FormField } from './types/form';

export interface FormEntity {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
  fields: FormField[];
  status: 'draft' | 'active' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export interface FormResponseData {
  _id?: string;
  id?: string;
  formId: string;
  userId: string;
  answers: Record<string, any>;
  submittedAt?: string;
}

export async function fetchFormsByEntity(
  entityType: string,
  entityId: string
): Promise<FormEntity[]> {
  try {
    const res = await apiClient.get<FormEntity[] | { data: FormEntity[] }>(
      `/forms?entityType=${entityType}&entityId=${entityId}`
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  } catch {
    return [];
  }
}

export async function fetchFormById(formId: string): Promise<FormEntity> {
  return apiClient.get<FormEntity>(`/forms/${formId}`);
}

export async function createForm(payload: {
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
  fields: FormField[];
  status?: 'draft' | 'active' | 'closed';
}): Promise<FormEntity> {
  return apiClient.post<FormEntity>('/forms', payload);
}

export async function updateForm(
  formId: string,
  payload: Partial<FormEntity>
): Promise<FormEntity> {
  return apiClient.put<FormEntity>(`/forms/${formId}`, payload);
}

export async function submitFormResponse(
  formId: string,
  answers: Record<string, any>
): Promise<FormResponseData> {
  return apiClient.post<FormResponseData>(`/forms/${formId}/responses`, {
    answers
  });
}

export async function fetchFormResponses(
  formId: string
): Promise<FormResponseData[]> {
  try {
    const res = await apiClient.get<
      FormResponseData[] | { data: FormResponseData[] }
    >(`/forms/${formId}/responses`);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  } catch {
    return [];
  }
}

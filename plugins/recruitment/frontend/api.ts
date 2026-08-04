import { apiClient } from '@campus-os/shared/api-client';
import { CandidateStatus } from './components/KanbanBoard';

export interface Campaign {
  _id: string;
  clubId: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  onboardRoleName: string;
  formId: string;
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface CandidateAPI {
  _id: string;
  campaignId: string;
  userId: string;
  responseId: string;
  status: CandidateStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Campaigns
export async function getCampaigns(
  entityType: string,
  entityId: string
): Promise<Campaign[]> {
  const res = await apiClient.get<Campaign[]>(
    `/recruitment/campaigns?entityType=${entityType}&entityId=${entityId}`
  );
  return res;
}

export async function createCampaign(
  entityType: string,
  entityId: string,
  payload: {
    title: string;
    description: string;
    onboardRoleName: string;
    formSchema: any;
  }
): Promise<Campaign> {
  // First, create the Form entity
  const formRes = await apiClient.post<any>('/forms', {
    ...payload.formSchema,
    entityType,
    entityId
  });

  // Extract the generated Form ID
  const formId = formRes._id;

  // Now create the Campaign
  const res = await apiClient.post<Campaign>('/recruitment/campaigns', {
    title: payload.title,
    description: payload.description,
    onboardRoleName: payload.onboardRoleName,
    entityType,
    entityId,
    formId
  });
  return res;
}

// Candidates
export async function getCandidates(
  campaignId: string
): Promise<CandidateAPI[]> {
  const res = await apiClient.get<CandidateAPI[]>(
    `/recruitment/campaigns/${campaignId}/candidates`
  );
  return res;
}

export async function updateCandidateStatus(
  campaignId: string,
  candidateId: string,
  status: CandidateStatus
): Promise<CandidateAPI> {
  const res = await apiClient.patch<CandidateAPI>(
    `/recruitment/campaigns/${campaignId}/candidates/${candidateId}/status`,
    { status }
  );
  return res;
}

export async function updateCandidateNotes(
  campaignId: string,
  candidateId: string,
  notes: string
): Promise<CandidateAPI> {
  const res = await apiClient.patch<CandidateAPI>(
    `/recruitment/campaigns/${campaignId}/candidates/${candidateId}/notes`,
    { notes }
  );
  return res;
}

// Form Fetching Helper
export async function getFormSchema(formId: string) {
  const res = await apiClient.get<any>(`/forms/${formId}`);
  return res;
}

export async function getFormResponse(formId: string, responseId: string) {
  const res = await apiClient.get<any>(
    `/forms/${formId}/responses/${responseId}`
  );
  return res;
}

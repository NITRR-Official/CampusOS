import { apiClient } from './api/client';

export const resourceAPI = {
  createResource(resourceData: Record<string, unknown>) {
    return apiClient.post('/api/v1/resources', resourceData);
  },

  getAllResources(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition)
      params.append('condition', String(filters.condition));

    return apiClient.get(`/api/v1/resources?${params}`);
  },

  getAvailableResources(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition)
      params.append('condition', String(filters.condition));

    return apiClient.get(`/api/v1/resources/available?${params}`);
  },

  getResourceById(resourceId: string) {
    return apiClient.get(`/api/v1/resources/${resourceId}`);
  },

  updateResource(resourceId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/api/v1/resources/${resourceId}`, updateData);
  },

  deleteResource(resourceId: string) {
    return apiClient.delete(`/api/v1/resources/${resourceId}`);
  },

  allocateResourceToEvent(
    eventId: string,
    resourceId: string,
    allocationData: Record<string, unknown>
  ) {
    return apiClient.post(
      `/api/v1/events/${eventId}/resources/${resourceId}`,
      allocationData
    );
  },

  getEventResources(eventId: string) {
    return apiClient.get(`/api/v1/events/${eventId}/resources`);
  },

  getResourceAllocations(resourceId: string) {
    return apiClient.get(`/api/v1/resources/${resourceId}/allocations`);
  },

  updateAllocationStatus(allocationId: string, status: string) {
    return apiClient.put(
      `/api/v1/resources/allocations/${allocationId}/status`,
      { status }
    );
  },

  updateMaintenance(resourceId: string, maintenanceDate: string) {
    return apiClient.put(`/api/v1/resources/${resourceId}/maintenance`, {
      maintenanceDate
    });
  }
};

export default resourceAPI;

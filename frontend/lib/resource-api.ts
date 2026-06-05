import { apiClient } from './api/client';

export const resourceAPI = {
  createResource(resourceData: Record<string, unknown>) {
    return apiClient.post('/resources', resourceData);
  },

  getAllResources(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition)
      params.append('condition', String(filters.condition));

    return apiClient.get(`/resources?${params}`);
  },

  getAvailableResources(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition)
      params.append('condition', String(filters.condition));

    return apiClient.get(`/resources/available?${params}`);
  },

  getResourceById(resourceId: string) {
    return apiClient.get(`/resources/${resourceId}`);
  },

  updateResource(resourceId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/resources/${resourceId}`, updateData);
  },

  deleteResource(resourceId: string) {
    return apiClient.delete(`/resources/${resourceId}`);
  },

  allocateResourceToEvent(
    eventId: string,
    resourceId: string,
    allocationData: Record<string, unknown>
  ) {
    return apiClient.post(
      `/events/${eventId}/resources/${resourceId}`,
      allocationData
    );
  },

  getEventResources(eventId: string) {
    return apiClient.get(`/events/${eventId}/resources`);
  },

  getResourceAllocations(resourceId: string) {
    return apiClient.get(`/resources/${resourceId}/allocations`);
  },

  updateAllocationStatus(allocationId: string, status: string) {
    return apiClient.put(
      `/resources/allocations/${allocationId}/status`,
      { status }
    );
  },

  updateMaintenance(resourceId: string, maintenanceDate: string) {
    return apiClient.put(`/resources/${resourceId}/maintenance`, {
      maintenanceDate
    });
  }
};

export default resourceAPI;

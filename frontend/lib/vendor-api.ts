import { apiClient } from './api/client';

export const vendorAPI = {
  createVendor(vendorData: Record<string, unknown>) {
    return apiClient.post('/api/v1/vendors', vendorData);
  },

  getAllVendors(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', String(filters.category));
    if (filters.status) params.append('status', String(filters.status));

    return apiClient.get(`/api/v1/vendors?${params}`);
  },

  getVendorById(vendorId: string) {
    return apiClient.get(`/api/v1/vendors/${vendorId}`);
  },

  updateVendor(vendorId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/api/v1/vendors/${vendorId}`, updateData);
  },

  deleteVendor(vendorId: string) {
    return apiClient.delete(`/api/v1/vendors/${vendorId}`);
  },

  assignVendorToEvent(
    eventId: string,
    vendorId: string,
    assignmentData: Record<string, unknown>
  ) {
    return apiClient.post(
      `/api/v1/events/${eventId}/vendors/${vendorId}`,
      assignmentData
    );
  },

  getEventVendors(eventId: string) {
    return apiClient.get(`/api/v1/events/${eventId}/vendors`);
  },

  getVendorAssignments(vendorId: string) {
    return apiClient.get(`/api/v1/vendors/${vendorId}/assignments`);
  },

  updateAssignmentStatus(assignmentId: string, status: string) {
    return apiClient.put(`/api/v1/vendors/assignments/${assignmentId}/status`, {
      status
    });
  },

  rateVendor(vendorId: string, rating: number) {
    return apiClient.post(`/api/v1/vendors/${vendorId}/rate`, { rating });
  }
};

export default vendorAPI;

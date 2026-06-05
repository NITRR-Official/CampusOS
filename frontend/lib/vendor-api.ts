import { apiClient } from './api/client';

export const vendorAPI = {
  createVendor(vendorData: Record<string, unknown>) {
    return apiClient.post('/vendors', vendorData);
  },

  getAllVendors(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', String(filters.category));
    if (filters.status) params.append('status', String(filters.status));

    return apiClient.get(`/vendors?${params}`);
  },

  getVendorById(vendorId: string) {
    return apiClient.get(`/vendors/${vendorId}`);
  },

  updateVendor(vendorId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/vendors/${vendorId}`, updateData);
  },

  deleteVendor(vendorId: string) {
    return apiClient.delete(`/vendors/${vendorId}`);
  },

  assignVendorToEvent(
    eventId: string,
    vendorId: string,
    assignmentData: Record<string, unknown>
  ) {
    return apiClient.post(
      `/events/${eventId}/vendors/${vendorId}`,
      assignmentData
    );
  },

  getEventVendors(eventId: string) {
    return apiClient.get(`/events/${eventId}/vendors`);
  },

  getVendorAssignments(vendorId: string) {
    return apiClient.get(`/vendors/${vendorId}/assignments`);
  },

  updateAssignmentStatus(assignmentId: string, status: string) {
    return apiClient.put(`/vendors/assignments/${assignmentId}/status`, {
      status
    });
  },

  rateVendor(vendorId: string, rating: number) {
    return apiClient.post(`/vendors/${vendorId}/rate`, { rating });
  }
};

export default vendorAPI;

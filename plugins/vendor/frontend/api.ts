import { z } from 'zod';
import { apiClient } from '@campus-os/shared/api-client';
export { ApiError as VendorApiError } from '@campus-os/shared/api-errors';

export const VendorSchema = z.object({
  id: z.string(),
  clubId: z.string().optional(),
  name: z.string(),
  category: z.string(),
  contactPerson: z.string(),
  email: z.string(),
  phone: z.string(),
  status: z.enum(['active', 'inactive', 'blacklisted']),
  rating: z.number().optional()
});

export type Vendor = z.infer<typeof VendorSchema>;

export const VendorAssignmentSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  eventId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'completed', 'cancelled']),
  assignedServices: z.array(z.string()),
  cost: z.number().optional()
});

export type VendorAssignment = z.infer<typeof VendorAssignmentSchema>;

export const vendorAPI = {
  async createVendor(clubId: string, vendorData: Record<string, unknown>) {
    const res = await apiClient.post('/vendors', { ...vendorData, clubId });
    return VendorSchema.parse(res);
  },

  async getAllVendors(clubId: string, filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    params.append('clubId', clubId);
    if (filters.category) params.append('category', String(filters.category));
    if (filters.status) params.append('status', String(filters.status));

    const res = await apiClient.get<{ vendors: unknown }>(`/vendors?${params}`);
    return z.array(VendorSchema).parse(res.vendors);
  },

  async getVendorById(vendorId: string) {
    const res = await apiClient.get(`/vendors/${vendorId}`);
    return VendorSchema.parse(res);
  },

  async updateVendor(vendorId: string, updateData: Record<string, unknown>) {
    const res = await apiClient.put(`/vendors/${vendorId}`, updateData);
    return VendorSchema.parse(res);
  },

  async deleteVendor(vendorId: string) {
    const res = await apiClient.delete(`/vendors/${vendorId}`);
    return res;
  },

  async assignVendorToEvent(
    eventId: string,
    vendorId: string,
    assignmentData: Record<string, unknown>
  ) {
    const res = await apiClient.post(
      `/events/${eventId}/vendors/${vendorId}`,
      assignmentData
    );
    return VendorAssignmentSchema.parse(res);
  },

  async getEventVendors(eventId: string) {
    const res = await apiClient.get<{ vendors: unknown }>(
      `/events/${eventId}/vendors`
    );
    return z.array(VendorAssignmentSchema).parse(res.vendors);
  },

  async getVendorAssignments(vendorId: string) {
    const res = await apiClient.get<{ assignments: unknown }>(
      `/vendors/${vendorId}/assignments`
    );
    return z.array(VendorAssignmentSchema).parse(res.assignments);
  },

  async updateAssignmentStatus(assignmentId: string, status: string) {
    const res = await apiClient.put(
      `/vendors/assignments/${assignmentId}/status`,
      {
        status
      }
    );
    return VendorAssignmentSchema.parse(res);
  },

  async rateVendor(vendorId: string, rating: number) {
    const res = await apiClient.post(`/vendors/${vendorId}/rate`, { rating });
    return VendorSchema.parse(res);
  }
};

export default vendorAPI;

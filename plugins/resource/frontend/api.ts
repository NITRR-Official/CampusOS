import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
export { ApiError as ResourceApiError } from '@/lib/api/errors';

export const ResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.enum(['available', 'allocated', 'maintenance', 'retired']),
  condition: z.string().optional(),
  lastMaintenance: z.string().nullable()
});

export type Resource = z.infer<typeof ResourceSchema>;

export const AllocationSchema = z.object({
  id: z.string(),
  resourceId: z.string(),
  eventId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'active', 'completed']),
  allocatedFrom: z.string(),
  allocatedTo: z.string()
});

export type Allocation = z.infer<typeof AllocationSchema>;

export const resourceAPI = {
  async createResource(resourceData: Record<string, unknown>) {
    const res = await apiClient.post('/resources', resourceData);
    return ResourceSchema.parse(res);
  },

  async getAllResources(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition)
      params.append('condition', String(filters.condition));

    const res = await apiClient.get(`/resources?${params}`);
    return z.array(ResourceSchema).parse(res);
  },

  async getAvailableResources(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', String(filters.type));
    if (filters.status) params.append('status', String(filters.status));
    if (filters.condition)
      params.append('condition', String(filters.condition));

    const res = await apiClient.get(`/resources/available?${params}`);
    return z.array(ResourceSchema).parse(res);
  },

  async getResourceById(resourceId: string) {
    const res = await apiClient.get(`/resources/${resourceId}`);
    return ResourceSchema.parse(res);
  },

  async updateResource(
    resourceId: string,
    updateData: Record<string, unknown>
  ) {
    const res = await apiClient.put(`/resources/${resourceId}`, updateData);
    return ResourceSchema.parse(res);
  },

  async deleteResource(resourceId: string) {
    const res = await apiClient.delete(`/resources/${resourceId}`);
    return res;
  },

  async allocateResourceToEvent(
    eventId: string,
    resourceId: string,
    allocationData: Record<string, unknown>
  ) {
    const res = await apiClient.post(
      `/events/${eventId}/resources/${resourceId}`,
      allocationData
    );
    return AllocationSchema.parse(res);
  },

  async getEventResources(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/resources`);
    return z.array(AllocationSchema).parse(res);
  },

  async getResourceAllocations(resourceId: string) {
    const res = await apiClient.get(`/resources/${resourceId}/allocations`);
    return z.array(AllocationSchema).parse(res);
  },

  async updateAllocationStatus(allocationId: string, status: string) {
    const res = await apiClient.put(
      `/resources/allocations/${allocationId}/status`,
      {
        status
      }
    );
    return AllocationSchema.parse(res);
  },

  async updateMaintenance(resourceId: string, maintenanceDate: string) {
    const res = await apiClient.put(`/resources/${resourceId}/maintenance`, {
      maintenanceDate
    });
    return ResourceSchema.parse(res);
  }
};

export default resourceAPI;

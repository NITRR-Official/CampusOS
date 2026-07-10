import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
export { ApiError as SchedulingApiError } from '@/lib/api/errors';

export const TimeSlotSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  venue: z.string().optional(),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled'])
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const ConflictSchema = z.object({
  id: z.string(),
  slot1Id: z.string(),
  slot2Id: z.string(),
  conflictType: z.enum(['venue', 'time', 'resource', 'personnel']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  resolved: z.boolean(),
  resolution: z.string().optional()
});

export type Conflict = z.infer<typeof ConflictSchema>;

export const schedulingAPI = {
  async createTimeSlot(eventId: string, slotData: Record<string, unknown>) {
    const res = await apiClient.post(`/events/${eventId}/schedule`, slotData);
    return TimeSlotSchema.parse(res);
  },

  async getEventSchedule(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/schedule`);
    return z.array(TimeSlotSchema).parse(res);
  },

  async getTimeSlot(slotId: string) {
    const res = await apiClient.get(`/schedule/${slotId}`);
    return TimeSlotSchema.parse(res);
  },

  async updateTimeSlot(slotId: string, updateData: Record<string, unknown>) {
    const res = await apiClient.put(`/schedule/${slotId}`, updateData);
    return TimeSlotSchema.parse(res);
  },

  async deleteTimeSlot(slotId: string) {
    const res = await apiClient.delete(`/schedule/${slotId}`);
    return res;
  },

  async getAllConflicts(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.resolved !== undefined)
      params.append('resolved', String(filters.resolved));
    if (filters.severity) params.append('severity', String(filters.severity));

    const res = await apiClient.get(`/schedule/conflicts?${params}`);
    return z.array(ConflictSchema).parse(res);
  },

  async getSlotConflicts(slotId: string) {
    const res = await apiClient.get(`/schedule/${slotId}/conflicts`);
    return z.array(ConflictSchema).parse(res);
  },

  async resolveConflict(conflictId: string, resolution: string) {
    const res = await apiClient.put(
      `/schedule/conflicts/${conflictId}/resolve`,
      {
        resolution
      }
    );
    return ConflictSchema.parse(res);
  },

  async checkVenueAvailability(
    venue: string,
    startTime: string | Date,
    endTime: string | Date
  ) {
    const params = new URLSearchParams({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });

    const res = await apiClient.get(
      `/schedule/venue/${venue}/available?${params}`
    );
    return z.object({ available: z.boolean() }).parse(res);
  },

  async getScheduleOverview(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/schedule/overview`);
    return res;
  }
};

export default schedulingAPI;

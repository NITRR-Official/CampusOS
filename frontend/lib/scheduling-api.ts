import { apiClient } from './api/client';

export const schedulingAPI = {
  createTimeSlot(eventId: string, slotData: Record<string, unknown>) {
    return apiClient.post(`/api/v1/events/${eventId}/schedule`, slotData);
  },

  getEventSchedule(eventId: string) {
    return apiClient.get(`/api/v1/events/${eventId}/schedule`);
  },

  getTimeSlot(slotId: string) {
    return apiClient.get(`/api/v1/schedule/${slotId}`);
  },

  updateTimeSlot(slotId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/api/v1/schedule/${slotId}`, updateData);
  },

  deleteTimeSlot(slotId: string) {
    return apiClient.delete(`/api/v1/schedule/${slotId}`);
  },

  getAllConflicts(filters: Record<string, unknown> = {}) {
    const params = new URLSearchParams();
    if (filters.resolved !== undefined)
      params.append('resolved', String(filters.resolved));
    if (filters.severity) params.append('severity', String(filters.severity));

    return apiClient.get(`/api/v1/schedule/conflicts?${params}`);
  },

  getSlotConflicts(slotId: string) {
    return apiClient.get(`/api/v1/schedule/${slotId}/conflicts`);
  },

  resolveConflict(conflictId: string, resolution: string) {
    return apiClient.put(`/api/v1/schedule/conflicts/${conflictId}/resolve`, {
      resolution
    });
  },

  checkVenueAvailability(
    venue: string,
    startTime: string | Date,
    endTime: string | Date
  ) {
    const params = new URLSearchParams({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });

    return apiClient.get(`/api/v1/schedule/venue/${venue}/available?${params}`);
  },

  getScheduleOverview(eventId: string) {
    return apiClient.get(`/api/v1/events/${eventId}/schedule/overview`);
  }
};

export default schedulingAPI;

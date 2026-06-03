import { apiClient } from './api/client';
export { ApiError as EventApiError } from './api/errors';

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  instituteId: string;
  clubId: string | null;
  venue: string | null;
  capacity: number | null;
  startsAt: string;
  endsAt: string | null;
  status: 'draft' | 'published';
  registrations: Array<{
    id: string;
    attendeeName: string;
    attendeeEmail: string;
    createdAt: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchEvents() {
  return apiClient.get<EventItem[]>('/api/v1/events');
}

export function fetchEventById(eventId: string) {
  return apiClient.get<EventItem>(`/api/v1/events/${eventId}`);
}

export function registerForEvent(
  eventId: string,
  payload: { attendeeName: string; attendeeEmail: string }
) {
  return apiClient.post(`/api/v1/events/${eventId}/registrations`, payload);
}

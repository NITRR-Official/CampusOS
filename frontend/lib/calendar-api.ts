import { apiClient } from './api/client';
export { ApiError as CalendarApiError } from './api/errors';

export type CalendarEventType = 'task-deadline' | 'event' | 'milestone';

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: CalendarEventType;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
  linkedTaskId: string | null;
  linkedEventId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function fetchAllCalendarEvents(accessToken?: string) {
  return apiClient.get<CalendarEvent[]>('/calendar', { accessToken });
}

export function fetchCalendarEventsByRange(
  accessToken: string | undefined,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  return apiClient.get<CalendarEvent[]>(
    `/calendar/range?${params.toString()}`,
    { accessToken }
  );
}

export function createCalendarEvent(
  accessToken: string | undefined,
  payload: {
    title: string;
    eventType: CalendarEventType;
    startsAt: string;
    endsAt?: string;
    description?: string;
    linkedTaskId?: string;
    linkedEventId?: string;
  }
) {
  return apiClient.post<CalendarEvent>('/calendar', payload, {
    accessToken
  });
}

export function deleteCalendarEvent(
  accessToken: string | undefined,
  eventId: string
) {
  return apiClient.delete(`/calendar/${eventId}`, undefined, {
    accessToken
  });
}

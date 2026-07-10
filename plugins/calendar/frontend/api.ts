import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
export { ApiError as CalendarApiError } from '@/lib/api/errors';

export const CalendarEventTypeSchema = z.enum(['task-deadline', 'event', 'milestone']);
export type CalendarEventType = z.infer<typeof CalendarEventTypeSchema>;

export const CalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  eventType: CalendarEventTypeSchema,
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  description: z.string().nullable(),
  linkedTaskId: z.string().nullable(),
  linkedEventId: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export async function fetchAllCalendarEvents() {
  const response = await apiClient.get('/calendar');
  return z.array(CalendarEventSchema).parse(response);
}

export async function fetchCalendarEventsByRange(
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  const response = await apiClient.get(`/calendar/range?${params.toString()}`);
  return z.array(CalendarEventSchema).parse(response);
}

export async function createCalendarEvent(
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
  const response = await apiClient.post('/calendar', payload);
  return CalendarEventSchema.parse(response);
}

export async function deleteCalendarEvent(eventId: string) {
  const response = await apiClient.delete(`/calendar/${eventId}`);
  return response;
}

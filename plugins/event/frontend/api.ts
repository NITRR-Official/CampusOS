import { apiClient } from '@/lib/api/client';
import { z } from 'zod';
export { ApiError as EventApiError } from '@/lib/api/errors';

export const EventRegistrationSchema = z.object({
  id: z.string(),
  attendeeName: z.string(),
  attendeeEmail: z.string().email(),
  createdAt: z.string()
});

export const EventItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  instituteId: z.string(),
  clubId: z.string().nullable(),
  venue: z.string().nullable(),
  capacity: z.number().nullable(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  status: z.enum(['draft', 'published']),
  registrations: z.array(EventRegistrationSchema),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type EventRegistration = z.infer<typeof EventRegistrationSchema>;
export type EventItem = z.infer<typeof EventItemSchema>;

export function fetchEvents() {
  return apiClient.get<EventItem[]>('/events', {
    schema: z.array(EventItemSchema)
  });
}

export function fetchEventById(eventId: string) {
  return apiClient.get<EventItem>(`/events/${eventId}`, {
    schema: EventItemSchema
  });
}

export function registerForEvent(
  eventId: string,
  payload: { attendeeName: string; attendeeEmail: string }
) {
  return apiClient.post(`/events/${eventId}/registrations`, payload);
}

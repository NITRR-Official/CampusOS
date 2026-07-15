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
  id: z.string().optional(),
  _id: z.string().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  instituteId: z.string(),
  clubId: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  startsAt: z.string(),
  endsAt: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']),
  registrations: z.array(EventRegistrationSchema).optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type EventRegistration = z.infer<typeof EventRegistrationSchema>;
export type EventItem = z.infer<typeof EventItemSchema>;

export function fetchEvents(clubId: string, accessToken?: string | null) {
  return apiClient.get<EventItem[]>(`/events?clubId=${clubId}`, {
    schema: z.array(EventItemSchema),
    accessToken,
    cache: 'no-store'
  });
}

export const PublicEventItemSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  clubId: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  startsAt: z.string(),
  endsAt: z.string().nullable().optional(),
  status: z.enum(['published']),
  capacity: z.number().nullable().optional(),
  registrationsCount: z.number().optional()
});

export type PublicEventItem = z.infer<typeof PublicEventItemSchema>;

export function fetchPublicEvents(clubId: string) {
  // Using standard Next.js fetch options bypass for TS
  return apiClient.get<PublicEventItem[]>(`/events/public?clubId=${clubId}`, {
    schema: z.array(PublicEventItemSchema),
    ...({ next: { revalidate: 60 } } as any)
  });
}

export function fetchPublicEventById(eventId: string) {
  return apiClient.get<PublicEventItem>(`/events/${eventId}/public`, {
    schema: PublicEventItemSchema,
    ...({ next: { revalidate: 60 } } as any)
  });
}

export function fetchEventById(eventId: string, accessToken?: string | null) {
  return apiClient.get<EventItem>(`/events/${eventId}`, {
    schema: EventItemSchema,
    accessToken,
    cache: 'no-store'
  });
}

export function registerForEvent(
  eventId: string,
  payload: { attendeeName: string; attendeeEmail: string }
) {
  return apiClient.post(`/events/${eventId}/registrations`, payload);
}

export function createEvent(payload: any) {
  return apiClient.post<EventItem>('/events', payload);
}

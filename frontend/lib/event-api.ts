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

export class EventApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EventApiError';
    this.status = status;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new EventApiError(json?.message || 'Request failed', response.status);
  }

  return json?.data;
}

export async function fetchEvents() {
  return (await request('/api/v1/events')) as EventItem[];
}

export async function fetchEventById(eventId: string) {
  return (await request(`/api/v1/events/${eventId}`)) as EventItem;
}

export async function registerForEvent(
  eventId: string,
  payload: { attendeeName: string; attendeeEmail: string }
) {
  return request(`/api/v1/events/${eventId}/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}

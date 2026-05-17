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

export class CalendarApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CalendarApiError';
    this.status = status;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request(
  path: string,
  init?: RequestInit,
  accessToken?: string | null
) {
  const headers = new Headers(init?.headers || {});

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new CalendarApiError(
      json?.message || 'Request failed',
      response.status
    );
  }

  return json?.data;
}

export function fetchAllCalendarEvents(accessToken: string) {
  return request('/api/v1/calendar', undefined, accessToken) as Promise<
    CalendarEvent[]
  >;
}

export function fetchCalendarEventsByRange(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams({
    startDate,
    endDate
  });
  return request(
    `/api/v1/calendar/range?${params.toString()}`,
    undefined,
    accessToken
  ) as Promise<CalendarEvent[]>;
}

export function createCalendarEvent(
  accessToken: string,
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
  return request(
    '/api/v1/calendar',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    accessToken
  ) as Promise<CalendarEvent>;
}

export function deleteCalendarEvent(accessToken: string, eventId: string) {
  return request(
    `/api/v1/calendar/${eventId}`,
    { method: 'DELETE' },
    accessToken
  );
}

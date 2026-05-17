/**
 * Check-in API Client
 * Frontend TypeScript client for check-in operations
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface CheckInRecord {
  id: string;
  eventId: string;
  userId: string;
  qrCode: string;
  status: 'pending' | 'checked-in';
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  eventId: string;
  totalRegistered: number;
  checkedIn: number;
  pending: number;
  checkInRate: string;
}

export class CheckInApiError extends Error {
  constructor(
    public status: number,
    public message: string
  ) {
    super(message);
  }
}

/**
 * Get all check-ins for an event (admin/coordinator only)
 */
export async function fetchCheckIns(
  accessToken: string,
  eventId: string
): Promise<CheckInRecord[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/events/${eventId}/checkins`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new CheckInApiError(
      response.status,
      error.error || 'Failed to fetch check-ins'
    );
  }

  const data = await response.json();
  return data.checkIns || [];
}

/**
 * Create a check-in record for an attendee (admin/coordinator only)
 */
export async function createCheckIn(
  accessToken: string,
  eventId: string,
  userId: string
): Promise<CheckInRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/events/${eventId}/checkins`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new CheckInApiError(
      response.status,
      error.error || 'Failed to create check-in'
    );
  }

  return response.json();
}

/**
 * Get check-in status for a user at an event
 */
export async function getCheckInStatus(
  accessToken: string,
  eventId: string,
  userId: string
): Promise<CheckInRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/events/${eventId}/checkins/status/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new CheckInApiError(
      response.status,
      error.error || 'Failed to get check-in status'
    );
  }

  return response.json();
}

/**
 * Scan QR code to check in (public endpoint)
 */
export async function scanQRCode(qrCode: string): Promise<CheckInRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/checkins/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ qrCode })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new CheckInApiError(
      response.status,
      error.error || 'Failed to scan QR code'
    );
  }

  const data = await response.json();
  return data.checkIn;
}

/**
 * Get attendance statistics for an event (admin/coordinator only)
 */
export async function fetchAttendanceStats(
  accessToken: string,
  eventId: string
): Promise<AttendanceStats> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/events/${eventId}/attendance-stats`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new CheckInApiError(
      response.status,
      error.error || 'Failed to fetch attendance stats'
    );
  }

  return response.json();
}

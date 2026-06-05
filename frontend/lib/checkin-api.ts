import { apiClient } from './api/client';
export { ApiError as CheckInApiError } from './api/errors';

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

export async function fetchCheckIns(
  accessToken: string | undefined,
  eventId: string
): Promise<CheckInRecord[]> {
  const data = await apiClient.get<{ checkIns?: CheckInRecord[] }>(
    `/events/${eventId}/checkins`,
    { accessToken }
  );
  return data?.checkIns || (data as unknown as CheckInRecord[]) || [];
}

export async function createCheckIn(
  accessToken: string | undefined,
  eventId: string,
  userId: string
): Promise<CheckInRecord> {
  return apiClient.post<CheckInRecord>(
    `/events/${eventId}/checkins`,
    { userId },
    { accessToken }
  );
}

export async function getCheckInStatus(
  accessToken: string | undefined,
  eventId: string,
  userId: string
): Promise<CheckInRecord> {
  return apiClient.get<CheckInRecord>(
    `/events/${eventId}/checkins/status/${userId}`,
    { accessToken }
  );
}

export async function scanQRCode(qrCode: string): Promise<CheckInRecord> {
  const data = await apiClient.post<{ checkIn: CheckInRecord }>(
    `/checkins/scan`,
    { qrCode }
  );
  return data?.checkIn || (data as unknown as CheckInRecord);
}

export async function fetchAttendanceStats(
  accessToken: string | undefined,
  eventId: string
): Promise<AttendanceStats> {
  return apiClient.get<AttendanceStats>(
    `/events/${eventId}/attendance-stats`,
    { accessToken }
  );
}

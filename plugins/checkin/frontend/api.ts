import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
export { ApiError as CheckInApiError } from '@/lib/api/errors';

export const CheckInRecordSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  qrCode: z.string(),
  status: z.enum(['pending', 'checked-in']),
  checkedInAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CheckInRecord = z.infer<typeof CheckInRecordSchema>;

export const AttendanceStatsSchema = z.object({
  eventId: z.string(),
  totalRegistered: z.number(),
  checkedIn: z.number(),
  pending: z.number(),
  checkInRate: z.string(),
});

export type AttendanceStats = z.infer<typeof AttendanceStatsSchema>;

export async function fetchCheckIns(eventId: string): Promise<CheckInRecord[]> {
  const data = await apiClient.get<{ checkIns?: any[] }>(`/events/${eventId}/checkins`);
  return z.array(CheckInRecordSchema).parse(data?.checkIns || data || []);
}

export async function createCheckIn(eventId: string, userId: string): Promise<CheckInRecord> {
  const response = await apiClient.post(`/events/${eventId}/checkins`, { userId });
  return CheckInRecordSchema.parse(response);
}

export async function getCheckInStatus(eventId: string, userId: string): Promise<CheckInRecord> {
  const response = await apiClient.get(`/events/${eventId}/checkins/status/${userId}`);
  return CheckInRecordSchema.parse(response);
}

export async function scanQRCode(qrCode: string): Promise<CheckInRecord> {
  const data = await apiClient.post<{ checkIn: any }>(`/checkins/scan`, { qrCode });
  return CheckInRecordSchema.parse(data?.checkIn || data);
}

export async function fetchAttendanceStats(eventId: string): Promise<AttendanceStats> {
  const response = await apiClient.get(`/events/${eventId}/attendance-stats`);
  return AttendanceStatsSchema.parse(response);
}

import { z } from 'zod';
import { apiClient } from '@campus-os/shared/api-client';
export { ApiError as CheckInApiError } from '@campus-os/shared/api-errors';

export const CheckInRecordSchema = z
  .object({
    id: z.string().optional(),
    _id: z.any().optional(),
    eventId: z.any().transform((v) => String(v)),
    userId: z.any().transform((v) => String(v)),
    qrCode: z.string(),
    status: z.enum(['pending', 'checked-in']),
    checkedInAt: z.any().nullable().optional(),
    createdAt: z.any().optional(),
    updatedAt: z.any().optional()
  })
  .transform((record) => ({
    ...record,
    id: record.id || (record._id ? String(record._id) : record.qrCode),
    checkedInAt: record.checkedInAt ? String(record.checkedInAt) : null,
    createdAt: record.createdAt
      ? String(record.createdAt)
      : new Date().toISOString(),
    updatedAt: record.updatedAt
      ? String(record.updatedAt)
      : new Date().toISOString()
  }));

export type CheckInRecord = z.infer<typeof CheckInRecordSchema>;

export const AttendanceStatsSchema = z.object({
  eventId: z.string(),
  totalRegistered: z.number(),
  checkedIn: z.number(),
  pending: z.number(),
  checkInRate: z.union([z.string(), z.number()]).transform((v) => String(v))
});

export type AttendanceStats = z.infer<typeof AttendanceStatsSchema>;

export async function fetchCheckIns(eventId: string): Promise<CheckInRecord[]> {
  const data = await apiClient.get<{ checkIns?: any[] }>(
    `/events/${eventId}/checkins`
  );
  return z.array(CheckInRecordSchema).parse(data?.checkIns || data || []);
}

export async function createCheckIn(
  eventId: string,
  userId: string
): Promise<CheckInRecord> {
  const response = await apiClient.post(`/events/${eventId}/checkins`, {
    userId
  });
  return CheckInRecordSchema.parse(response);
}

export async function getCheckInStatus(
  eventId: string,
  userId: string
): Promise<CheckInRecord> {
  const response = await apiClient.get(
    `/events/${eventId}/checkins/status/${userId}`
  );
  return CheckInRecordSchema.parse(response);
}

export async function scanQRCode(qrCode: string): Promise<CheckInRecord> {
  const data = await apiClient.post<{ checkIn: any }>(`/checkins/scan`, {
    qrCode
  });
  return CheckInRecordSchema.parse(data?.checkIn || data);
}

export async function fetchAttendanceStats(
  eventId: string
): Promise<AttendanceStats> {
  const response = await apiClient.get(`/events/${eventId}/attendance-stats`);
  return AttendanceStatsSchema.parse(response);
}

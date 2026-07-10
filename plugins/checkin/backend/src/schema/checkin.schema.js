import { z } from 'zod';

export const createCheckInSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId is required')
  })
  .strict();

export const scanQRCodeSchema = z
  .object({
    qrCode: z
      .string()
      .trim()
      .min(1, 'qrCode is required')
      .max(200, 'qrCode cannot exceed 200 characters')
  })
  .strict();

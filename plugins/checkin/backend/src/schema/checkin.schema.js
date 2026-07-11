import { z } from 'zod';

export const createCheckInSchema = z
  .object({
    userId: z
      .string()
      .trim()
      .min(1, 'userId is required')
      .max(50, 'userId must be 50 characters or fewer')
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

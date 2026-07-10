import { z } from 'zod';

export const createTimeSlotSchemaBase = z
  .object({
    venue: z
      .string()
      .trim()
      .min(1, 'Venue is required')
      .max(150, 'Venue must be 150 characters or fewer'),
    startTime: z
      .string()
      .datetime('startTime must be a valid ISO date-time string'),
    endTime: z
      .string()
      .datetime('endTime must be a valid ISO date-time string'),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
    allocatedResources: z
      .array(
        z.object({
          resourceId: z.string().trim().min(1, 'Resource ID is required'),
          quantity: z.number().int().min(1, 'Quantity must be at least 1')
        })
      )
      .optional()
      .default([]),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be 1000 characters or fewer')
      .optional()
  })
  .strict();

export const createTimeSlotSchema = createTimeSlotSchemaBase.refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return new Date(data.endTime) >= new Date(data.startTime);
    }
    return true;
  },
  {
    message: 'endTime cannot be before startTime',
    path: ['endTime']
  }
);

export const updateTimeSlotSchema = createTimeSlotSchemaBase
  .partial()
  .strict()
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) >= new Date(data.startTime);
      }
      return true;
    },
    {
      message: 'endTime cannot be before startTime',
      path: ['endTime']
    }
  );

export const resolveConflictSchema = z
  .object({
    resolution: z
      .string()
      .trim()
      .min(1, 'Resolution is required')
      .max(1000, 'Resolution must be 1000 characters or fewer')
  })
  .strict();

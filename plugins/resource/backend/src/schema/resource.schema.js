import { z } from 'zod';

export const createResourceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be 100 characters or fewer'),
    type: z.enum(
      ['equipment', 'furniture', 'technology', 'consumable', 'other'],
      {
        errorMap: () => ({ message: 'Invalid resource type' })
      }
    ),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    description: z
      .string()
      .trim()
      .max(500, 'Description must be 500 characters or fewer')
      .optional()
      .default(''),
    location: z
      .string()
      .trim()
      .max(120, 'Location must be 120 characters or fewer')
      .optional()
      .default(''),
    owner: z
      .string()
      .trim()
      .max(100, 'Owner must be 100 characters or fewer')
      .optional()
      .default(''),
    cost: z
      .number()
      .nonnegative('Cost must be a non-negative number')
      .optional()
      .default(0)
  })
  .strict();

export const updateResourceSchema = createResourceSchema.partial().strict();

export const allocateResourceSchema = z
  .object({
    allocatedQuantity: z
      .number()
      .int()
      .min(1, 'Allocated quantity must be at least 1'),
    startDate: z
      .string()
      .datetime('startDate must be a valid ISO date-time string'),
    endDate: z
      .string()
      .datetime('endDate must be a valid ISO date-time string'),
    notes: z
      .string()
      .trim()
      .max(500, 'Notes must be 500 characters or fewer')
      .optional()
      .default('')
  })
  .strict()
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'endDate cannot be before startDate',
      path: ['endDate']
    }
  );

export const updateAllocationStatusSchema = z
  .object({
    status: z.enum(['pending', 'allocated', 'in-use', 'returned', 'damaged'], {
      errorMap: () => ({ message: 'Invalid allocation status' })
    })
  })
  .strict();

export const updateMaintenanceSchema = z
  .object({
    maintenanceDate: z
      .string()
      .datetime('maintenanceDate must be a valid ISO date-time string')
  })
  .strict();

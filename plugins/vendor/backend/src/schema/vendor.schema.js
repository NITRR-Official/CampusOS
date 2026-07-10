import { z } from 'zod';

export const createVendorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(150, 'Name must be 150 characters or fewer'),
    category: z.string().trim().min(1, 'Category is required'),
    contactPerson: z
      .string()
      .trim()
      .min(2, 'Contact person must be at least 2 characters')
      .max(100, 'Contact person must be 100 characters or fewer'),
    email: z.string().trim().toLowerCase().email('Valid email is required'),
    phone: z
      .string()
      .trim()
      .min(5, 'Phone must be at least 5 characters')
      .max(20, 'Phone must be 20 characters or fewer'),
    address: z
      .string()
      .trim()
      .max(500, 'Address must be 500 characters or fewer')
      .optional()
      .nullable(),
    bankDetails: z.any().optional().nullable()
  })
  .strict();

export const updateVendorSchema = createVendorSchema.partial().strict();

export const assignVendorSchema = z
  .object({
    amount: z
      .number()
      .nonnegative('Amount must be a non-negative number')
      .optional()
      .nullable(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must be 1000 characters or fewer')
      .optional()
      .nullable()
  })
  .strict();

export const updateVendorAssignmentStatusSchema = z
  .object({
    status: z.enum(['assigned', 'confirmed', 'completed', 'cancelled'], {
      errorMap: () => ({ message: 'Invalid assignment status' })
    })
  })
  .strict();

export const rateVendorSchema = z
  .object({
    rating: z
      .number()
      .min(0, 'Rating must be at least 0')
      .max(5, 'Rating must be at most 5')
  })
  .strict();

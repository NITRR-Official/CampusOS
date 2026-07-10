import { z } from 'zod';

export const createInstituteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must be between 3 and 120 characters')
      .max(120, 'Name must be between 3 and 120 characters'),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'Code must be between 2 and 12 characters')
      .max(12, 'Code must be between 2 and 12 characters')
      .optional()
      .default(''),
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
      .default('')
  })
  .strict();

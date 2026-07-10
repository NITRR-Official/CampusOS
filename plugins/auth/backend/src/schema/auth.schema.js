import { z } from 'zod';

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 80 characters')
      .max(80, 'Name must be between 2 and 80 characters'),
    email: z.string().trim().toLowerCase().email('Email must be valid'),
    password: z
      .string()
      .min(8, 'Password must be between 8 and 128 characters')
      .max(128, 'Password must be between 8 and 128 characters')
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email must be valid'),
    password: z.string().min(1, 'Password is required')
  })
  .strict();

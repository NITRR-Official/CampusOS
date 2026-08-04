import { z } from 'zod';

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 80 characters')
      .max(80, 'Name must be between 2 and 80 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(255, 'Email must be 255 characters or fewer')
      .email('Email must be valid'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be fewer than 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(255, 'Email must be 255 characters or fewer')
      .email('Email must be valid'),
    password: z.string().min(1, 'Password is required')
  })
  .strict();

export const updateRoleSchema = z
  .object({
    isSuperAdmin: z.boolean()
  })
  .strict();

export const updateStatusSchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

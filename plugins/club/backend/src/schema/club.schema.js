import { z } from 'zod';

export const createClubSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must be between 3 and 120 characters')
      .max(120, 'Name must be between 3 and 120 characters'),

    description: z
      .string()
      .trim()
      .max(1000, 'Description must be 1000 characters or fewer')
      .optional()
      .default(''),
    category: z
      .string()
      .trim()
      .min(1, 'Category is required')
      .max(100, 'Category must be 100 characters or fewer'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Valid official club email is required')
      .max(255, 'Email must be 255 characters or fewer')
  })
  .strict()
  .transform((data) => ({ ...data, status: 'pending_verification' }));

export const addMemberSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Valid email is required')
      .max(255, 'Email must be 255 characters or fewer'),
    role: z
      .string()
      .trim()
      .min(1, 'Role is required')
      .max(50, 'Role must be 50 characters or fewer')
      .default('volunteer')
  })
  .strict();

export const assignRoleSchema = z
  .object({
    role: z
      .string()
      .trim()
      .min(1, 'Role is required')
      .max(50, 'Role must be 50 characters or fewer')
  })
  .strict();

export const createRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Role name must be between 2 and 50 characters')
      .max(50, 'Role name must be between 2 and 50 characters'),
    permissions: z.array(z.string()).default([]),
    hierarchyLevel: z.number().int().default(0),
    roleType: z.enum(['team', 'role']).default('role'),
    color: z.string().trim().max(30).nullable().default(null)
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Role name must be between 2 and 50 characters')
      .max(50, 'Role name must be between 2 and 50 characters')
      .optional(),
    permissions: z.array(z.string()).optional(),
    hierarchyLevel: z.number().int().optional(),
    color: z.string().trim().max(30).nullable().optional()
  })
  .strict();

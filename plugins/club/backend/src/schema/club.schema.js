import { z } from 'zod';
import { PERMISSIONS } from './role.model.js';

const VALID_PERMISSIONS = Object.values(PERMISSIONS);

export const createClubSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Name must be between 3 and 120 characters')
      .max(120, 'Name must be between 3 and 120 characters'),
    instituteId: z.string().trim().min(1, 'Institute ID is required'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must be 1000 characters or fewer')
      .optional()
      .default(''),
    category: z.string().trim().min(1, 'Category is required'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Valid official club email is required')
  })
  .strict()
  .transform((data) => ({ ...data, status: 'pending_verification' }));

export const addMemberSchema = z
  .object({
    userId: z.string().trim().min(1, 'User ID is required'),
    name: z
      .string()
      .trim()
      .min(2, 'Name must be between 2 and 80 characters')
      .max(80, 'Name must be between 2 and 80 characters'),
    email: z.string().trim().toLowerCase().email('Valid email is required'),
    role: z.string().trim().min(1, 'Role is required').default('volunteer')
  })
  .strict();

export const assignRoleSchema = z
  .object({
    role: z.string().trim().min(1, 'Role is required')
  })
  .strict();

export const createRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Role name must be between 2 and 50 characters')
      .max(50, 'Role name must be between 2 and 50 characters'),
    permissions: z
      .array(
        z.enum(VALID_PERMISSIONS, {
          errorMap: () => ({ message: 'Invalid permission' })
        })
      )
      .default([]),
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
    permissions: z
      .array(
        z.enum(VALID_PERMISSIONS, {
          errorMap: () => ({ message: 'Invalid permission' })
        })
      )
      .optional(),
    hierarchyLevel: z.number().int().optional(),
    color: z.string().trim().max(30).nullable().optional()
  })
  .strict();

import { z } from 'zod';

export const createCampaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200),
    description: z.string().trim().max(1000).optional().default(''),
    entityType: z.string().trim().min(1, 'Entity type is required').max(100),
    entityId: z.string().trim().min(1, 'Entity ID is required').max(100),
    formId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Form ID'),
    status: z.enum(['draft', 'active', 'closed']).optional().default('draft'),
    onboardRoleName: z.string().trim().max(100).optional().default('volunteer')
  })
  .strict();

export const updateCampaignSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(1000).optional(),
    status: z.enum(['draft', 'active', 'closed']).optional(),
    onboardRoleName: z.string().trim().max(100).optional()
  })
  .strict();

export const updateCandidateStatusSchema = z
  .object({
    status: z.enum([
      'applied',
      'shortlisted',
      'interview',
      'selected',
      'rejected'
    ])
  })
  .strict();

export const updateCandidateNotesSchema = z
  .object({
    notes: z.string().trim().max(2000)
  })
  .strict();

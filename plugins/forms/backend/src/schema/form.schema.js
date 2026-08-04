import { z } from 'zod';

const formFieldSchema = z
  .object({
    id: z.string().trim().min(1, 'Field ID is required').max(100),
    label: z.string().trim().min(1, 'Field label is required').max(255),
    type: z.enum([
      'text',
      'textarea',
      'number',
      'email',
      'select',
      'radio',
      'checkbox'
    ]),
    required: z.boolean().default(false),
    placeholder: z.string().trim().max(255).optional(),
    options: z.array(z.string().trim().min(1)).optional()
  })
  .strict();

export const createFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(200),
    description: z.string().trim().max(1000).optional().default(''),
    entityType: z.string().trim().min(1, 'Entity type is required').max(100),
    entityId: z.string().trim().min(1, 'Entity ID is required').max(100),
    fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
    status: z.enum(['draft', 'active', 'closed']).optional().default('draft')
  })
  .strict();

export const updateFormSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(1000).optional(),
    fields: z.array(formFieldSchema).min(1).optional(),
    status: z.enum(['draft', 'active', 'closed']).optional()
  })
  .strict();

export const submitFormResponseSchema = z
  .object({
    answers: z.record(
      z.union([
        z.string().max(5000),
        z.number(),
        z.boolean(),
        z.array(z.string().max(500))
      ])
    )
  })
  .strict();

import { z } from 'zod';

export const createTaskSchema = z
  .object({
    clubId: z.string().trim().min(1, 'clubId is required'),
    title: z
      .string()
      .trim()
      .min(3, 'Title must be between 3 and 140 characters')
      .max(140, 'Title must be between 3 and 140 characters'),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must be 1000 characters or fewer')
      .optional()
      .default(''),
    assigneeName: z
      .string()
      .trim()
      .min(2, 'Assignee name must be between 2 and 80 characters')
      .max(80, 'Assignee name must be between 2 and 80 characters')
      .optional()
      .nullable(),
    dueDate: z
      .string()
      .datetime('dueDate must be a valid ISO date-time string')
      .optional()
      .nullable(),
    priority: z
      .enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'Priority must be low, medium, or high' })
      })
      .optional()
      .default('medium')
  })
  .strict();

export const updateTaskSchema = createTaskSchema.partial().strict();

export const assignTaskSchema = z
  .object({
    assigneeName: z
      .string()
      .trim()
      .min(2, 'Assignee name must be between 2 and 80 characters')
      .max(80, 'Assignee name must be between 2 and 80 characters')
  })
  .strict();

export const updateTaskStatusSchema = z
  .object({
    status: z.enum(['todo', 'in-progress', 'done'], {
      errorMap: () => ({ message: 'Status must be todo, in-progress, or done' })
    })
  })
  .strict();

export const updateTaskPrioritySchema = z
  .object({
    priority: z.enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: 'Priority must be low, medium, or high' })
    })
  })
  .strict();

import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    totalAllocation: z
      .number()
      .nonnegative('Total allocation must be a non-negative number'),
    budgetBreakdown: z
      .array(
        z.object({
          category: z
            .string()
            .trim()
            .min(1, 'Category is required')
            .max(100, 'Category cannot exceed 100 characters'),
          amount: z
            .number()
            .nonnegative('Amount must be a non-negative number'),
          description: z
            .string()
            .trim()
            .max(500, 'Description cannot exceed 500 characters')
            .optional()
        })
      )
      .optional()
      .default([]),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'Currency must be a 3-letter code')
      .optional()
      .default('INR'),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
  })
  .strict();

export const updateBudgetSchema = createBudgetSchema.partial().strict();

export const approveBudgetSchema = z
  .object({
    userId: z
      .string()
      .trim()
      .min(1, 'userId is required')
      .max(50, 'userId must be 50 characters or fewer')
  })
  .strict();

export const logExpenseSchema = z
  .object({
    category: z
      .string()
      .trim()
      .min(1, 'Category is required')
      .max(100, 'Category cannot exceed 100 characters'),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(500, 'Description cannot exceed 500 characters'),
    amount: z.number().nonnegative('Amount must be a non-negative number'),
    vendor: z
      .string()
      .trim()
      .max(150, 'Vendor cannot exceed 150 characters')
      .optional(),
    paymentMethod: z
      .string()
      .trim()
      .max(50, 'Payment method cannot exceed 50 characters')
      .optional()
      .default('pending'),
    receipt: z
      .string()
      .trim()
      .url('Receipt must be a valid URL')
      .max(1000, 'Receipt URL must be 1000 characters or fewer')
      .optional(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .optional()
  })
  .strict();

export const updateExpenseSchema = logExpenseSchema.partial().strict();

export const markExpensePaidSchema = z
  .object({
    paymentMethod: z
      .string()
      .trim()
      .min(1, 'Payment method is required')
      .max(50, 'Payment method cannot exceed 50 characters')
  })
  .strict();

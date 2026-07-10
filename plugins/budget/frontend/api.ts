import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

export { ApiError as BudgetApiError };

export const BudgetSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  totalAllocation: z.number(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'archived']),
});

export type Budget = z.infer<typeof BudgetSchema>;

export const ExpenseSchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  amount: z.number(),
  category: z.string(),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']),
  paymentMethod: z.string().optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const BudgetSummarySchema = z.object({
  totalAllocation: z.number(),
  totalExpenses: z.number(),
  remaining: z.number(),
  utilisationPercent: z.number(),
  expensesByCategory: z.record(z.number()),
  paidExpenses: z.number(),
  pendingExpenses: z.number(),
});

export type BudgetSummary = z.infer<typeof BudgetSummarySchema>;

export const budgetAPI = {
  async createBudget(eventId: string, budgetData: Record<string, unknown>) {
    const res = await apiClient.post(`/events/${eventId}/budget`, budgetData);
    return BudgetSchema.parse(res);
  },

  async getEventBudget(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/budget`);
    return BudgetSchema.parse(res);
  },

  async getBudgetById(budgetId: string) {
    const res = await apiClient.get(`/budget/${budgetId}`);
    return BudgetSchema.parse(res);
  },

  async updateBudget(budgetId: string, updateData: Record<string, unknown>) {
    const res = await apiClient.put(`/budget/${budgetId}`, updateData);
    return BudgetSchema.parse(res);
  },

  async approveBudget(budgetId: string, userId: string) {
    const res = await apiClient.post(`/budget/${budgetId}/approve`, { userId });
    return BudgetSchema.parse(res);
  },

  async rejectBudget(budgetId: string) {
    const res = await apiClient.post(`/budget/${budgetId}/reject`, {});
    return BudgetSchema.parse(res);
  },

  async logExpense(budgetId: string, expenseData: Record<string, unknown>) {
    const res = await apiClient.post(`/budget/${budgetId}/expense`, expenseData);
    return ExpenseSchema.parse(res);
  },

  async getBudgetExpenses(budgetId: string) {
    const res = await apiClient.get(`/budget/${budgetId}/expenses`);
    return z.array(ExpenseSchema).parse(res);
  },

  async getExpenseById(expenseId: string) {
    const res = await apiClient.get(`/budget/expense/${expenseId}`);
    return ExpenseSchema.parse(res);
  },

  async updateExpense(expenseId: string, updateData: Record<string, unknown>) {
    const res = await apiClient.put(`/budget/expense/${expenseId}`, updateData);
    return ExpenseSchema.parse(res);
  },

  async markExpenseAsPaid(expenseId: string, paymentMethod: string) {
    const res = await apiClient.post(`/budget/expense/${expenseId}/mark-paid`, {
      paymentMethod
    });
    return ExpenseSchema.parse(res);
  },

  async getBudgetSummary(budgetId: string) {
    const res = await apiClient.get(`/budget/${budgetId}/summary`);
    return BudgetSummarySchema.parse(res);
  },

  async getBudgetVsActual(budgetId: string) {
    const res = await apiClient.get(`/budget/${budgetId}/vs-actual`);
    return res; // Can be defined further if needed
  }
};

export default budgetAPI;

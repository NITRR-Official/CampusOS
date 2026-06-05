import { apiClient } from './api/client';

export const budgetAPI = {
  createBudget(eventId: string, budgetData: Record<string, unknown>) {
    return apiClient.post(`/events/${eventId}/budget`, budgetData);
  },

  getEventBudget(eventId: string) {
    return apiClient.get(`/events/${eventId}/budget`);
  },

  getBudgetById(budgetId: string) {
    return apiClient.get(`/budget/${budgetId}`);
  },

  updateBudget(budgetId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/budget/${budgetId}`, updateData);
  },

  approveBudget(budgetId: string, userId: string) {
    return apiClient.post(`/budget/${budgetId}/approve`, { userId });
  },

  rejectBudget(budgetId: string) {
    return apiClient.post(`/budget/${budgetId}/reject`, {});
  },

  logExpense(budgetId: string, expenseData: Record<string, unknown>) {
    return apiClient.post(`/budget/${budgetId}/expense`, expenseData);
  },

  getBudgetExpenses(budgetId: string) {
    return apiClient.get(`/budget/${budgetId}/expenses`);
  },

  getExpenseById(expenseId: string) {
    return apiClient.get(`/budget/expense/${expenseId}`);
  },

  updateExpense(expenseId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/budget/expense/${expenseId}`, updateData);
  },

  markExpenseAsPaid(expenseId: string, paymentMethod: string) {
    return apiClient.post(`/budget/expense/${expenseId}/mark-paid`, {
      paymentMethod
    });
  },

  getBudgetSummary(budgetId: string) {
    return apiClient.get(`/budget/${budgetId}/summary`);
  },

  getBudgetVsActual(budgetId: string) {
    return apiClient.get(`/budget/${budgetId}/vs-actual`);
  }
};

export default budgetAPI;

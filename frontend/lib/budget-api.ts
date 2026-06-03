import { apiClient } from './api/client';

export const budgetAPI = {
  createBudget(eventId: string, budgetData: Record<string, unknown>) {
    return apiClient.post(`/api/v1/events/${eventId}/budget`, budgetData);
  },

  getEventBudget(eventId: string) {
    return apiClient.get(`/api/v1/events/${eventId}/budget`);
  },

  getBudgetById(budgetId: string) {
    return apiClient.get(`/api/v1/budget/${budgetId}`);
  },

  updateBudget(budgetId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/api/v1/budget/${budgetId}`, updateData);
  },

  approveBudget(budgetId: string, userId: string) {
    return apiClient.post(`/api/v1/budget/${budgetId}/approve`, { userId });
  },

  rejectBudget(budgetId: string) {
    return apiClient.post(`/api/v1/budget/${budgetId}/reject`, {});
  },

  logExpense(budgetId: string, expenseData: Record<string, unknown>) {
    return apiClient.post(`/api/v1/budget/${budgetId}/expense`, expenseData);
  },

  getBudgetExpenses(budgetId: string) {
    return apiClient.get(`/api/v1/budget/${budgetId}/expenses`);
  },

  getExpenseById(expenseId: string) {
    return apiClient.get(`/api/v1/budget/expense/${expenseId}`);
  },

  updateExpense(expenseId: string, updateData: Record<string, unknown>) {
    return apiClient.put(`/api/v1/budget/expense/${expenseId}`, updateData);
  },

  markExpenseAsPaid(expenseId: string, paymentMethod: string) {
    return apiClient.post(`/api/v1/budget/expense/${expenseId}/mark-paid`, {
      paymentMethod
    });
  },

  getBudgetSummary(budgetId: string) {
    return apiClient.get(`/api/v1/budget/${budgetId}/summary`);
  },

  getBudgetVsActual(budgetId: string) {
    return apiClient.get(`/api/v1/budget/${budgetId}/vs-actual`);
  }
};

export default budgetAPI;

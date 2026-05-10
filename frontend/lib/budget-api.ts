/**
 * Budget API Client
 * Frontend API integration for budget management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const budgetAPI = {
  /**
   * Create budget for event
   */
  async createBudget(eventId: string, budgetData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/budget`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(budgetData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create budget');
    }

    return response.json();
  },

  /**
   * Get budget for event
   */
  async getEventBudget(eventId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/events/${eventId}/budget`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Budget not found for this event');
    }

    return response.json();
  },

  /**
   * Get budget by ID
   */
  async getBudgetById(budgetId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Budget not found');
    }

    return response.json();
  },

  /**
   * Update budget
   */
  async updateBudget(budgetId: string, updateData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update budget');
    }

    return response.json();
  },

  /**
   * Approve budget
   */
  async approveBudget(budgetId: string, userId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error('Failed to approve budget');
    }

    return response.json();
  },

  /**
   * Reject budget
   */
  async rejectBudget(budgetId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to reject budget');
    }

    return response.json();
  },

  /**
   * Log an expense
   */
  async logExpense(budgetId: string, expenseData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to log expense');
    }

    return response.json();
  },

  /**
   * Get budget expenses
   */
  async getBudgetExpenses(budgetId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}/expenses`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }

    return response.json();
  },

  /**
   * Get expense by ID
   */
  async getExpenseById(expenseId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/expense/${expenseId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Expense not found');
    }

    return response.json();
  },

  /**
   * Update expense
   */
  async updateExpense(expenseId: string, updateData: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/expense/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update expense');
    }

    return response.json();
  },

  /**
   * Mark expense as paid
   */
  async markExpenseAsPaid(expenseId: string, paymentMethod: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/expense/${expenseId}/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ paymentMethod })
    });

    if (!response.ok) {
      throw new Error('Failed to mark expense as paid');
    }

    return response.json();
  },

  /**
   * Get budget summary
   */
  async getBudgetSummary(budgetId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}/summary`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch budget summary');
    }

    return response.json();
  },

  /**
   * Get budget vs actual comparison
   */
  async getBudgetVsActual(budgetId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE}/api/v1/budget/${budgetId}/vs-actual`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch budget comparison');
    }

    return response.json();
  }
};

export default budgetAPI;

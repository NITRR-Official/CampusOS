/**
 * Budget Routes
 * Registers budget management endpoints with Express
 */

import budgetController from '../controller/budget.controller.js';

export function registerBudgetRoutes(app, requirePermissions) {
  // Create budget (needs budget:manage)
  app.post(
    '/api/v1/events/:eventId/budget',
    requirePermissions('budget:manage'),
    budgetController.createBudget
  );

  // Get budget for event (needs budget:view)
  app.get(
    '/api/v1/events/:eventId/budget',
    requirePermissions('budget:view'),
    budgetController.getEventBudget
  );

  // Get budget by ID (needs budget:view)
  app.get(
    '/api/v1/budget/:budgetId',
    requirePermissions('budget:view'),
    budgetController.getBudget
  );

  // Update budget (needs budget:manage)
  app.put(
    '/api/v1/budget/:budgetId',
    requirePermissions('budget:manage'),
    budgetController.updateBudget
  );

  // Approve budget (needs budget:manage)
  app.post(
    '/api/v1/budget/:budgetId/approve',
    requirePermissions('budget:manage'),
    budgetController.approveBudget
  );

  // Reject budget (needs budget:manage)
  app.post(
    '/api/v1/budget/:budgetId/reject',
    requirePermissions('budget:manage'),
    budgetController.rejectBudget
  );

  // Log expense (needs budget:manage)
  app.post(
    '/api/v1/budget/:budgetId/expense',
    requirePermissions('budget:manage'),
    budgetController.logExpense
  );

  // Get expenses for budget (needs budget:view)
  app.get(
    '/api/v1/budget/:budgetId/expenses',
    requirePermissions('budget:view'),
    budgetController.getBudgetExpenses
  );

  // Get expense by ID (needs budget:view)
  app.get(
    '/api/v1/budget/expense/:expenseId',
    requirePermissions('budget:view'),
    budgetController.getExpense
  );

  // Update expense (needs budget:manage)
  app.put(
    '/api/v1/budget/expense/:expenseId',
    requirePermissions('budget:manage'),
    budgetController.updateExpense
  );

  // Mark expense as paid (needs budget:manage)
  app.post(
    '/api/v1/budget/expense/:expenseId/mark-paid',
    requirePermissions('budget:manage'),
    budgetController.markExpenseAsPaid
  );

  // Get budget summary (needs budget:view)
  app.get(
    '/api/v1/budget/:budgetId/summary',
    requirePermissions('budget:view'),
    budgetController.getBudgetSummary
  );

  // Get budget vs actual (needs budget:view)
  app.get(
    '/api/v1/budget/:budgetId/vs-actual',
    requirePermissions('budget:view'),
    budgetController.getBudgetVsActual
  );
}

export default registerBudgetRoutes;

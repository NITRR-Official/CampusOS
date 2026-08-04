/**
 * Budget Routes
 * Registers budget management endpoints with Express
 */

import { createBudgetController } from '../controller/budget.controller.js';

export function registerBudgetRoutes(app, requirePermissions, budgetService) {
  const budgetController = createBudgetController(budgetService);
  const viewBudget = requirePermissions('budget:view');

  // Create budget (admin/coordinator only)
  app.post(
    '/api/v1/events/:eventId/budget',
    requirePermissions('budget:manage'),
    budgetController.createBudget
  );

  // Get budget for event
  app.get(
    '/api/v1/events/:eventId/budget',
    viewBudget,
    budgetController.getEventBudget
  );

  // Get budget by ID
  app.get('/api/v1/budget/:budgetId', viewBudget, budgetController.getBudget);

  // Update budget (admin/coordinator only)
  app.put(
    '/api/v1/budget/:budgetId',
    requirePermissions('budget:manage'),
    budgetController.updateBudget
  );

  // Approve budget (admin only)
  app.post(
    '/api/v1/budget/:budgetId/approve',
    requirePermissions('budget:manage'),
    budgetController.approveBudget
  );

  // Reject budget (admin only)
  app.post(
    '/api/v1/budget/:budgetId/reject',
    requirePermissions('budget:manage'),
    budgetController.rejectBudget
  );

  // Log expense (admin/coordinator only)
  app.post(
    '/api/v1/budget/:budgetId/expense',
    requirePermissions('budget:manage'),
    budgetController.logExpense
  );

  // Get expenses for budget
  app.get(
    '/api/v1/budget/:budgetId/expenses',
    viewBudget,
    budgetController.getBudgetExpenses
  );

  // Get expense by ID
  app.get(
    '/api/v1/budget/expense/:expenseId',
    viewBudget,
    budgetController.getExpense
  );

  // Update expense (admin/coordinator only)
  app.put(
    '/api/v1/budget/expense/:expenseId',
    requirePermissions('budget:manage'),
    budgetController.updateExpense
  );

  // Mark expense as paid (admin/coordinator only)
  app.post(
    '/api/v1/budget/expense/:expenseId/mark-paid',
    requirePermissions('budget:manage'),
    budgetController.markExpenseAsPaid
  );

  // Get budget summary
  app.get(
    '/api/v1/budget/:budgetId/summary',
    viewBudget,
    budgetController.getBudgetSummary
  );

  // Get budget vs actual
  app.get(
    '/api/v1/budget/:budgetId/vs-actual',
    viewBudget,
    budgetController.getBudgetVsActual
  );
}

export default registerBudgetRoutes;

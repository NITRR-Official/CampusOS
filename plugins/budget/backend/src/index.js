/**
 * Budget Plugin
 * Handles event budget allocation and expense tracking
 */

import { registerBudgetRoutes } from './routes/budget.routes.js';
import BudgetService from './service/budget.service.js';
import { registerBudgetHandlers } from './listeners/index.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const budgetService = new BudgetService(eventBus);
  registerBudgetRoutes(app, requirePermissions, budgetService);

  registry.registerModule('budget', {
    routes: [
      'POST /api/v1/events/:eventId/budget',
      'GET /api/v1/events/:eventId/budget',
      'GET /api/v1/budget/:budgetId',
      'PUT /api/v1/budget/:budgetId',
      'POST /api/v1/budget/:budgetId/approve',
      'POST /api/v1/budget/:budgetId/reject',
      'POST /api/v1/budget/:budgetId/expense',
      'GET /api/v1/budget/:budgetId/expenses',
      'GET /api/v1/budget/expense/:expenseId',
      'PUT /api/v1/budget/expense/:expenseId',
      'POST /api/v1/budget/expense/:expenseId/mark-paid',
      'GET /api/v1/budget/:budgetId/summary',
      'GET /api/v1/budget/:budgetId/vs-actual'
    ]
  });

  if (registry.permissions) {
    registry.permissions.register({
      id: 'budget:view',
      module: 'budget',
      label: 'View Budgets',
      description: 'Allows viewing budgets and transactions'
    });
    registry.permissions.register({
      id: 'budget:manage',
      module: 'budget',
      label: 'Manage Budget',
      description: 'Allows allocating budgets, tracking expenses, and approvals'
    });
  }

  registry.registerContextResolver('/api/v1/budget', async (req) => {
    let budgetId = req.params?.budgetId;

    // Handle expense routes where budgetId is not directly in the URL but expenseId is
    if (req.path.includes('/expense/') && req.params.expenseId) {
      try {
        const ExpenseModel = (await import('./schema/expense.model.js'))
          .Expense;
        const exp = await ExpenseModel.findById(req.params.expenseId)
          .select('budgetId')
          .lean();
        budgetId = exp?.budgetId;
      } catch {
        return null;
      }
    } else if (!budgetId) {
      budgetId = req.url.split('/')[4];
    }

    if (!budgetId || budgetId === 'expense') return null;

    try {
      const BudgetModel = (await import('./schema/budget.model.js')).Budget;
      const budgetDoc = await BudgetModel.findById(budgetId)
        .select('clubId')
        .lean();
      return budgetDoc?.clubId
        ? { type: 'clubService', id: budgetDoc.clubId.toString() }
        : null;
    } catch {
      return null;
    }
  });

  if (eventBus) {
    registerBudgetHandlers(eventBus, registry, budgetService);
  }
}

export default init;

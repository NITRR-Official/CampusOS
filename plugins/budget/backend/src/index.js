/**
 * Budget Plugin
 * Handles event budget allocation and expense tracking
 */

import { registerBudgetRoutes } from './routes/budget.routes.js';
import { createBudgetService } from './service/budget.service.js';
import { createBudgetRepository } from './repository/budget.repository.js';
import { registerBudgetHandlers } from './listeners/index.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const budgetRepository = createBudgetRepository();
  const budgetService = createBudgetService(budgetRepository, eventBus);
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
    if (req.path.includes('/expense/')) {
      const expenseId =
        req.params?.expenseId || req.path.split('/')[4]?.split('?')[0];
      if (expenseId) {
        budgetId = await budgetRepository.getBudgetIdByExpenseId(expenseId);
      }
    } else if (!budgetId) {
      budgetId = req.path.split('/')[4]?.split('?')[0];
    }

    if (!budgetId || budgetId === 'expense') return null;

    const clubId = await budgetRepository.getClubIdByBudgetId(budgetId);
    return clubId ? { type: 'club:member_service', id: clubId } : null;
  });

  if (eventBus) {
    registerBudgetHandlers(eventBus, registry, budgetService);
  }
}

export default init;

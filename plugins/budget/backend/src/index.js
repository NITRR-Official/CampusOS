/**
 * Budget Plugin
 * Handles event budget allocation and expense tracking
 */

import { registerBudgetRoutes } from './routes/budget.routes.js';
import BudgetService from './service/budget.service.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  const budgetService = new BudgetService();
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
      id: 'budget:manage',
      module: 'budget',
      label: 'Manage Budget',
      description: 'Allows allocating budgets, tracking expenses, and approvals'
    });
  }

  if (eventBus) {
    eventBus.on('event:deleted', async (payload) => {
      if (payload && payload.eventId) {
        await budgetService.deleteEventBudget(payload.eventId);
      }
    });
  }
}

export default init;

/**
 * Budget Plugin
 * Handles event budget allocation and expense tracking
 */

import { registerBudgetRoutes } from './routes/budget.routes.js';

export async function init(app, registry, eventBus) {
  const requireRoles = registry.getService('requireRoles');
  const requirePermissions = registry.getService('requirePermissions') || requireRoles;

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerBudgetRoutes(app, requirePermissions);

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

  // Register atomic permissions for RBAC
  if (registry.permissions) {
    registry.permissions.register({
      id: 'budget:view',
      module: 'budget',
      label: 'View Budget',
      description: 'Allows viewing event budget details and expenses'
    });
    registry.permissions.register({
      id: 'budget:manage',
      module: 'budget',
      label: 'Manage Budget',
      description: 'Allows creating, updating, and approving/rejecting budgets and logging expenses'
    });
  }
}

export default init;

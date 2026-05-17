import BudgetService from '../service/budget.service.js';

const budgetService = new BudgetService();

/**
 * Budget Controller
 * HTTP request handlers for budget operations
 */

export const budgetController = {
  /**
   * POST /api/v1/events/:eventId/budget
   * Create budget for event (admin/coordinator only)
   */
  async createBudget(req, res, next) {
    try {
      const { eventId } = req.params;
      const { totalAllocation, budgetBreakdown, currency, notes } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      const result = await budgetService.createBudget({
        eventId,
        totalAllocation,
        budgetBreakdown,
        currency,
        notes
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.budget);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/events/:eventId/budget
   * Get budget for event
   */
  async getEventBudget(req, res, next) {
    try {
      const { eventId } = req.params;

      if (!eventId) {
        return res.status(400).json({ error: 'eventId is required' });
      }

      const budget = await budgetService.getEventBudget(eventId);

      if (!budget) {
        return res
          .status(404)
          .json({ error: 'Budget not found for this event' });
      }

      return res.status(200).json(budget);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/budget/:budgetId
   * Get budget by ID
   */
  async getBudget(req, res, next) {
    try {
      const { budgetId } = req.params;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const budget = await budgetService.getBudgetById(budgetId);

      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      return res.status(200).json(budget);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * PUT /api/v1/budget/:budgetId
   * Update budget (admin/coordinator only)
   */
  async updateBudget(req, res, next) {
    try {
      const { budgetId } = req.params;
      const updateData = req.body;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const result = await budgetService.updateBudget(budgetId, updateData);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.budget);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/budget/:budgetId/approve
   * Approve budget (admin only)
   */
  async approveBudget(req, res, next) {
    try {
      const { budgetId } = req.params;
      const { userId } = req.body;

      if (!budgetId || !userId) {
        return res
          .status(400)
          .json({ error: 'budgetId and userId are required' });
      }

      const result = await budgetService.approveBudget(budgetId, userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.budget);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/budget/:budgetId/reject
   * Reject budget (admin only)
   */
  async rejectBudget(req, res, next) {
    try {
      const { budgetId } = req.params;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const result = await budgetService.rejectBudget(budgetId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.budget);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/budget/:budgetId/expense
   * Log an expense (admin/coordinator only)
   */
  async logExpense(req, res, next) {
    try {
      const { budgetId } = req.params;
      const {
        category,
        description,
        amount,
        vendor,
        paymentMethod,
        receipt,
        notes
      } = req.body;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const result = await budgetService.logExpense(budgetId, {
        category,
        description,
        amount,
        vendor,
        paymentMethod,
        receipt,
        notes
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(201).json(result.expense);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/budget/:budgetId/expenses
   * Get all expenses for a budget
   */
  async getBudgetExpenses(req, res, next) {
    try {
      const { budgetId } = req.params;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const expenses = await budgetService.getBudgetExpenses(budgetId);

      return res.status(200).json({
        budgetId,
        count: expenses.length,
        expenses
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/budget/expense/:expenseId
   * Get expense by ID
   */
  async getExpense(req, res, next) {
    try {
      const { expenseId } = req.params;

      if (!expenseId) {
        return res.status(400).json({ error: 'expenseId is required' });
      }

      const expense = await budgetService.getExpenseById(expenseId);

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      return res.status(200).json(expense);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * PUT /api/v1/budget/expense/:expenseId
   * Update expense (admin/coordinator only)
   */
  async updateExpense(req, res, next) {
    try {
      const { expenseId } = req.params;
      const updateData = req.body;

      if (!expenseId) {
        return res.status(400).json({ error: 'expenseId is required' });
      }

      const result = await budgetService.updateExpense(expenseId, updateData);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.expense);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * POST /api/v1/budget/expense/:expenseId/mark-paid
   * Mark expense as paid (admin/coordinator only)
   */
  async markExpenseAsPaid(req, res, next) {
    try {
      const { expenseId } = req.params;
      const { paymentMethod } = req.body;

      if (!expenseId) {
        return res.status(400).json({ error: 'expenseId is required' });
      }

      const result = await budgetService.markExpenseAsPaid(
        expenseId,
        paymentMethod
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      return res.status(200).json(result.expense);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/budget/:budgetId/summary
   * Get budget summary with statistics
   */
  async getBudgetSummary(req, res, next) {
    try {
      const { budgetId } = req.params;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const summary = await budgetService.getBudgetSummary(budgetId);

      if (!summary) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      return res.status(200).json(summary);
    } catch (error) {
      return next(error);
    }
  },

  /**
   * GET /api/v1/budget/:budgetId/vs-actual
   * Get budget vs actual comparison
   */
  async getBudgetVsActual(req, res, next) {
    try {
      const { budgetId } = req.params;

      if (!budgetId) {
        return res.status(400).json({ error: 'budgetId is required' });
      }

      const comparison = await budgetService.getBudgetVsActual(budgetId);

      if (!comparison) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      return res.status(200).json(comparison);
    } catch (error) {
      return next(error);
    }
  }
};

export default budgetController;

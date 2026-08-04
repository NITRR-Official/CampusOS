import {
  createBudgetSchema,
  updateBudgetSchema,
  approveBudgetSchema,
  logExpenseSchema,
  updateExpenseSchema,
  markExpensePaidSchema
} from '../schema/budget.schema.js';

export function createBudgetController(budgetService) {
  return {
    async createBudget(req, res, next) {
      try {
        const { eventId } = req.params;
        const value = createBudgetSchema.parse(req.body);
        const budget = await budgetService.createBudget({
          eventId,
          ...value
        });
        return res.status(201).json(budget);
      } catch (error) {
        return next(error);
      }
    },
    async getEventBudget(req, res, next) {
      try {
        const { eventId } = req.params;
        const budget = await budgetService.getEventBudget(eventId);
        return res.status(200).json(budget);
      } catch (error) {
        return next(error);
      }
    },
    async getBudget(req, res, next) {
      try {
        const { budgetId } = req.params;
        const budget = await budgetService.getBudgetById(budgetId);
        return res.status(200).json(budget);
      } catch (error) {
        return next(error);
      }
    },
    async updateBudget(req, res, next) {
      try {
        const { budgetId } = req.params;
        const updateData = updateBudgetSchema.parse(req.body);
        const budget = await budgetService.updateBudget(budgetId, updateData);
        return res.status(200).json(budget);
      } catch (error) {
        return next(error);
      }
    },
    async approveBudget(req, res, next) {
      try {
        const { budgetId } = req.params;
        const { userId } = approveBudgetSchema.parse(req.body);
        const budget = await budgetService.approveBudget(budgetId, userId);
        return res.status(200).json(budget);
      } catch (error) {
        return next(error);
      }
    },
    async rejectBudget(req, res, next) {
      try {
        const { budgetId } = req.params;
        const budget = await budgetService.rejectBudget(budgetId);
        return res.status(200).json(budget);
      } catch (error) {
        return next(error);
      }
    },
    async logExpense(req, res, next) {
      try {
        const { budgetId } = req.params;
        const value = logExpenseSchema.parse(req.body);
        const expense = await budgetService.logExpense(budgetId, value);
        return res.status(201).json(expense);
      } catch (error) {
        return next(error);
      }
    },
    async getBudgetExpenses(req, res, next) {
      try {
        const { budgetId } = req.params;
        const expenses = await budgetService.getBudgetExpenses(budgetId);
        return res.status(200).json({
          count: expenses.length,
          expenses
        });
      } catch (error) {
        return next(error);
      }
    },
    async getExpense(req, res, next) {
      try {
        const { expenseId } = req.params;
        const expense = await budgetService.getExpenseById(expenseId);
        return res.status(200).json(expense);
      } catch (error) {
        return next(error);
      }
    },
    async updateExpense(req, res, next) {
      try {
        const { expenseId } = req.params;
        const updateData = updateExpenseSchema.parse(req.body);
        const expense = await budgetService.updateExpense(
          expenseId,
          updateData
        );
        return res.status(200).json(expense);
      } catch (error) {
        return next(error);
      }
    },
    async markExpenseAsPaid(req, res, next) {
      try {
        const { expenseId } = req.params;
        const { paymentMethod } = markExpensePaidSchema.parse(req.body);
        const expense = await budgetService.markExpenseAsPaid(
          expenseId,
          paymentMethod
        );
        return res.status(200).json(expense);
      } catch (error) {
        return next(error);
      }
    },
    async getBudgetSummary(req, res, next) {
      try {
        const { budgetId } = req.params;
        const summary = await budgetService.getBudgetSummary(budgetId);
        return res.status(200).json(summary);
      } catch (error) {
        return next(error);
      }
    },
    async getBudgetVsActual(req, res, next) {
      try {
        const { budgetId } = req.params;
        const comparison = await budgetService.getBudgetVsActual(budgetId);
        return res.status(200).json(comparison);
      } catch (error) {
        return next(error);
      }
    }
  };
}

export default createBudgetController;

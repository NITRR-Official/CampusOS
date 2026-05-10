import crypto from 'crypto';
import { Budget, Expense } from '../../../../backend/src/database/schemas/budget.schema.js';

/**
 * Budget Service
 * Manages budget allocation, expense tracking, and financial reporting
 */

function normalizeBudget(budgetDoc) {
  if (!budgetDoc) {
    return null;
  }

  const budget = budgetDoc.toObject ? budgetDoc.toObject() : { ...budgetDoc };
  budget.id = budget.id || budget._id;
  delete budget._id;

  return budget;
}

function normalizeExpense(expenseDoc) {
  if (!expenseDoc) {
    return null;
  }

  const expense = expenseDoc.toObject ? expenseDoc.toObject() : { ...expenseDoc };
  expense.id = expense.id || expense._id;
  delete expense._id;

  return expense;
}

export class BudgetService {
  /**
   * Create budget for event
   * @param {object} budgetData - Budget information
   * @returns {object} Created budget record
   */
  async createBudget(budgetData) {
    const { eventId, totalAllocation, budgetBreakdown, currency, notes } = budgetData;

    if (!eventId || !totalAllocation) {
      return { success: false, error: 'Missing required fields: eventId, totalAllocation' };
    }

    if (totalAllocation <= 0) {
      return { success: false, error: 'Budget allocation must be greater than 0' };
    }

    try {
      const existing = await Budget.findOne({ eventId }).lean();
      if (existing) {
        return { success: false, error: 'Budget already exists for this event' };
      }

      const budget = await Budget.create({
        eventId,
        totalAllocation,
        budgetBreakdown: budgetBreakdown || [],
        currency: currency || 'INR',
        approvalStatus: 'draft',
        approvedBy: null,
        approvedDate: null,
        notes: notes || null
      });

      return { success: true, budget: normalizeBudget(budget) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get budget by ID
   * @param {string} budgetId - Budget ID
   * @returns {object|null} Budget record
   */
  async getBudgetById(budgetId) {
    try {
      const budget = await Budget.findById(budgetId).lean();
      return normalizeBudget(budget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      return null;
    }
  }

  /**
   * Get budget for event
   * @param {string} eventId - Event ID
   * @returns {object|null} Budget record for event
   */
  async getEventBudget(eventId) {
    try {
      const budget = await Budget.findOne({ eventId }).lean();
      return normalizeBudget(budget);
    } catch (error) {
      console.error('Error fetching event budget:', error);
      return null;
    }
  }

  /**
   * Update budget
   * @param {string} budgetId - Budget ID
   * @param {object} updateData - Data to update
   * @returns {object} Updated budget
   */
  async updateBudget(budgetId, updateData) {
    try {
      const budget = await Budget.findById(budgetId);

      if (!budget) {
        return { success: false, error: 'Budget not found' };
      }

      if (budget.approvalStatus === 'approved') {
        return { success: false, error: 'Cannot modify an approved budget' };
      }

      Object.assign(budget, updateData, { updatedAt: new Date() });
      await budget.save();

      return { success: true, budget: normalizeBudget(budget) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve budget
   * @param {string} budgetId - Budget ID
   * @param {string} userId - User ID approving budget
   * @returns {object} Updated budget
   */
  async approveBudget(budgetId, userId) {
    try {
      const budget = await Budget.findById(budgetId);

      if (!budget) {
        return { success: false, error: 'Budget not found' };
      }

      if (budget.approvalStatus === 'approved') {
        return { success: false, error: 'Budget is already approved' };
      }

      budget.approvalStatus = 'approved';
      budget.approvedBy = userId;
      budget.approvedDate = new Date();
      budget.updatedAt = new Date();

      await budget.save();

      return { success: true, budget: normalizeBudget(budget) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject budget
   * @param {string} budgetId - Budget ID
   * @returns {object} Updated budget
   */
  async rejectBudget(budgetId) {
    try {
      const budget = await Budget.findById(budgetId);

      if (!budget) {
        return { success: false, error: 'Budget not found' };
      }

      budget.approvalStatus = 'rejected';
      budget.updatedAt = new Date();

      await budget.save();

      return { success: true, budget: normalizeBudget(budget) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log an expense
   * @param {string} budgetId - Budget ID
   * @param {object} expenseData - Expense information
   * @returns {object} Created expense record
   */
  async logExpense(budgetId, expenseData) {
    const budget = await Budget.findById(budgetId).lean();

    if (!budget) {
      return { success: false, error: 'Budget not found' };
    }

    const { category, description, amount, vendor, paymentMethod, receipt, notes } = expenseData;

    if (!category || !description || !amount) {
      return { success: false, error: 'Missing required fields: category, description, amount' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Expense amount must be greater than 0' };
    }

    const totalExpenses = await this.getTotalExpenses(budgetId);
    if (totalExpenses + amount > budget.totalAllocation) {
      return {
        success: false,
        error: `Expense exceeds budget. Remaining: ${budget.totalAllocation - totalExpenses}`
      };
    }

    try {
      const expense = await Expense.create({
        budgetId,
        category,
        description,
        amount,
        vendor: vendor || null,
        paymentMethod: paymentMethod || 'pending',
        paymentStatus: 'pending',
        paidDate: null,
        receipt: receipt || null,
        approvedBy: null,
        notes: notes || null
      });

      return { success: true, expense: normalizeExpense(expense) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all expenses for a budget
   * @param {string} budgetId - Budget ID
   * @returns {array} Expense records
   */
  async getBudgetExpenses(budgetId) {
    try {
      const expenses = await Expense.find({ budgetId }).lean();
      return expenses.map((expense) => normalizeExpense(expense));
    } catch (error) {
      console.error('Error fetching budget expenses:', error);
      return [];
    }
  }

  /**
   * Get expense by ID
   * @param {string} expenseId - Expense ID
   * @returns {object|null} Expense record
   */
  async getExpenseById(expenseId) {
    try {
      const expense = await Expense.findById(expenseId).lean();
      return normalizeExpense(expense);
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  /**
   * Update expense
   * @param {string} expenseId - Expense ID
   * @param {object} updateData - Data to update
   * @returns {object} Updated expense
   */
  async updateExpense(expenseId, updateData) {
    try {
      const expense = await Expense.findById(expenseId);

      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      if (expense.paymentStatus === 'paid' && updateData.amount) {
        return { success: false, error: 'Cannot modify amount of a paid expense' };
      }

      Object.assign(expense, updateData, { updatedAt: new Date() });
      await expense.save();

      return { success: true, expense: normalizeExpense(expense) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark expense as paid
   * @param {string} expenseId - Expense ID
   * @param {string} paymentMethod - Payment method used
   * @returns {object} Updated expense
   */
  async markExpenseAsPaid(expenseId, paymentMethod) {
    try {
      const expense = await Expense.findById(expenseId);

      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      expense.paymentStatus = 'paid';
      expense.paymentMethod = paymentMethod || expense.paymentMethod;
      expense.paidDate = new Date();
      expense.updatedAt = new Date();

      await expense.save();

      return { success: true, expense: normalizeExpense(expense) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get total expenses for a budget
   * @param {string} budgetId - Budget ID
   * @returns {number} Total expenses amount
   */
  async getTotalExpenses(budgetId) {
    const result = await Expense.aggregate([
      { $match: { budgetId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result[0]?.total || 0;
  }

  /**
   * Get budget summary/overview
   * @param {string} budgetId - Budget ID
   * @returns {object} Budget overview with statistics
   */
  async getBudgetSummary(budgetId) {
    const budget = await Budget.findById(budgetId).lean();

    if (!budget) {
      return null;
    }

    const expenses = await this.getBudgetExpenses(budgetId);
    const totalExpenses = await this.getTotalExpenses(budgetId);
    const remaining = budget.totalAllocation - totalExpenses;
    const utilisationPercent = (totalExpenses / budget.totalAllocation) * 100;

    const expensesByCategory = {};
    expenses.forEach((expense) => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += expense.amount;
    });

    const paidExpenses = expenses
      .filter((expense) => expense.paymentStatus === 'paid')
      .reduce((total, expense) => total + expense.amount, 0);

    const pendingExpenses = expenses
      .filter((expense) => expense.paymentStatus === 'pending')
      .reduce((total, expense) => total + expense.amount, 0);

    return {
      budgetId,
      eventId: budget.eventId,
      totalAllocation: budget.totalAllocation,
      totalExpenses,
      remaining,
      utilisationPercent: utilisationPercent.toFixed(2),
      approvalStatus: budget.approvalStatus,
      expenseCount: expenses.length,
      paidExpenses,
      pendingExpenses,
      expensesByCategory,
      expenses
    };
  }

  /**
   * Get comparison between allocation and breakdown
   * @param {string} budgetId - Budget ID
   * @returns {object} Comparison data
   */
  async getBudgetVsActual(budgetId) {
    const budget = await Budget.findById(budgetId).lean();
    if (!budget) {
      return null;
    }

    const expenses = await this.getBudgetExpenses(budgetId);
    const breakdown = {};
    const actual = {};

    budget.budgetBreakdown.forEach((item) => {
      breakdown[item.category] = item.amount;
    });

    expenses.forEach((expense) => {
      if (!actual[expense.category]) {
        actual[expense.category] = 0;
      }
      actual[expense.category] += expense.amount;
    });

    const variance = {};
    const allCategories = new Set([...Object.keys(breakdown), ...Object.keys(actual)]);

    allCategories.forEach((category) => {
      const planned = breakdown[category] || 0;
      const spent = actual[category] || 0;
      variance[category] = {
        planned,
        actual: spent,
        difference: spent - planned,
        variancePercent: planned > 0 ? ((spent - planned) / planned * 100).toFixed(2) : 'N/A'
      };
    });

    return {
      budgetId,
      breakdown,
      actual,
      variance
    };
  }
}

export default BudgetService;

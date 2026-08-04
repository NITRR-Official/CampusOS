import { AppError } from '@campus-os/shared/errors';

function normalizeBudget(budgetDoc) {
  if (!budgetDoc) return null;
  const budget = budgetDoc.toObject ? budgetDoc.toObject() : { ...budgetDoc };
  budget.id = budget.id || budget._id;
  delete budget._id;
  return budget;
}

function normalizeExpense(expenseDoc) {
  if (!expenseDoc) return null;
  const expense = expenseDoc.toObject
    ? expenseDoc.toObject()
    : { ...expenseDoc };
  expense.id = expense.id || expense._id;
  delete expense._id;
  return expense;
}

export function createBudgetService(budgetRepository, eventBus) {
  async function createBudget(budgetData) {
    const { eventId, totalAllocation, budgetBreakdown, currency, notes } =
      budgetData;

    const existing = await budgetRepository.getBudgetByEventId(eventId);
    if (existing) {
      throw new AppError(
        'Budget already exists for this event',
        409,
        'BUDGET_EXISTS'
      );
    }

    const budget = await budgetRepository.createBudget({
      eventId,
      totalAllocation,
      budgetBreakdown: budgetBreakdown || [],
      currency: currency || 'INR',
      approvalStatus: 'draft',
      approvedBy: null,
      approvedDate: null,
      notes: notes || null
    });

    const serialized = normalizeBudget(budget);
    if (eventBus) {
      eventBus.emit('budget:created', {
        budgetId: serialized.id,
        eventId: serialized.eventId,
        data: serialized
      });
    }
    return serialized;
  }

  async function getBudgetById(budgetId) {
    const budget = await budgetRepository.getBudgetById(budgetId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }
    return normalizeBudget(budget);
  }

  async function getEventBudget(eventId) {
    const budget = await budgetRepository.getBudgetByEventId(eventId);
    if (!budget) {
      throw new AppError(
        'Budget not found for this event',
        404,
        'BUDGET_NOT_FOUND'
      );
    }
    return normalizeBudget(budget);
  }

  async function deleteEventBudget(eventId) {
    const budget = await budgetRepository.getBudgetByEventId(eventId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }

    await budgetRepository.deleteBudget(budget._id || budget.id);
    return { deleted: true };
  }

  async function updateBudget(budgetId, updateData) {
    const budget = await budgetRepository.getBudgetById(budgetId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }

    if (budget.approvalStatus === 'approved') {
      throw new AppError(
        'Cannot modify an approved budget',
        400,
        'BUDGET_APPROVED'
      );
    }

    // SEC-12: Allowlist fields
    const allowedFields = [
      'totalAllocation',
      'budgetBreakdown',
      'currency',
      'notes'
    ];
    const safeUpdates = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        safeUpdates[field] = updateData[field];
      }
    }

    const updated = await budgetRepository.updateBudget(budgetId, safeUpdates);
    return normalizeBudget(updated);
  }

  async function approveBudget(budgetId, userId) {
    const budget = await budgetRepository.getBudgetById(budgetId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }

    if (budget.approvalStatus === 'approved') {
      throw new AppError(
        'Budget is already approved',
        400,
        'BUDGET_ALREADY_APPROVED'
      );
    }

    const updated = await budgetRepository.updateBudget(budgetId, {
      approvalStatus: 'approved',
      approvedBy: userId,
      approvedDate: new Date(),
      updatedAt: new Date()
    });

    const serialized = normalizeBudget(updated);
    if (eventBus) {
      eventBus.emit('budget:approved', {
        budgetId: serialized.id,
        eventId: serialized.eventId,
        data: serialized
      });
    }
    return serialized;
  }

  async function rejectBudget(budgetId) {
    const budget = await budgetRepository.getBudgetById(budgetId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }

    const updated = await budgetRepository.updateBudget(budgetId, {
      approvalStatus: 'rejected',
      updatedAt: new Date()
    });
    return normalizeBudget(updated);
  }

  async function logExpense(budgetId, expenseData) {
    // SEC-13: Handled by logExpenseAtomic in repository
    try {
      const expense = await budgetRepository.logExpenseAtomic(budgetId, {
        ...expenseData,
        paymentMethod: expenseData.paymentMethod || 'pending',
        paymentStatus: 'pending',
        paidDate: null,
        approvedBy: null
      });

      const serialized = normalizeExpense(expense);
      if (eventBus) {
        // Need eventId for eventBus
        const budget = await budgetRepository.getBudgetById(budgetId);
        eventBus.emit('budget:expense_logged', {
          budgetId,
          expenseId: serialized.id,
          eventId: budget?.eventId,
          data: serialized
        });
      }
      return serialized;
    } catch (error) {
      if (error.message === 'Budget not found') {
        throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
      }
      if (error.message.startsWith('Expense exceeds budget')) {
        throw new AppError(error.message, 400, 'BUDGET_EXCEEDED');
      }
      throw error;
    }
  }

  async function getBudgetExpenses(budgetId) {
    const expenses = await budgetRepository.getExpensesByBudget(budgetId);
    return expenses.map(normalizeExpense);
  }

  async function getExpenseById(expenseId) {
    const expense = await budgetRepository.getExpenseById(expenseId);
    if (!expense) {
      throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }
    return normalizeExpense(expense);
  }

  async function updateExpense(expenseId, updateData) {
    const expense = await budgetRepository.getExpenseById(expenseId);
    if (!expense) {
      throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    if (expense.paymentStatus === 'paid' && updateData.amount) {
      throw new AppError(
        'Cannot modify amount of a paid expense',
        400,
        'EXPENSE_ALREADY_PAID'
      );
    }

    const allowedFields = [
      'category',
      'description',
      'amount',
      'vendor',
      'paymentMethod',
      'receipt',
      'notes'
    ];
    const safeUpdates = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        safeUpdates[field] = updateData[field];
      }
    }

    const updated = await budgetRepository.updateExpense(
      expenseId,
      safeUpdates
    );
    return normalizeExpense(updated);
  }

  async function markExpenseAsPaid(expenseId, paymentMethod) {
    const expense = await budgetRepository.getExpenseById(expenseId);
    if (!expense) {
      throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    const updated = await budgetRepository.updateExpense(expenseId, {
      paymentStatus: 'paid',
      paymentMethod: paymentMethod || expense.paymentMethod,
      paidDate: new Date(),
      updatedAt: new Date()
    });
    return normalizeExpense(updated);
  }

  async function getTotalExpenses(budgetId) {
    return budgetRepository.getTotalExpenses(budgetId);
  }

  async function getBudgetSummary(budgetId) {
    const budget = await budgetRepository.getBudgetById(budgetId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }

    const expenses = await getBudgetExpenses(budgetId);
    const totalExpenses = await getTotalExpenses(budgetId);
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

  async function getBudgetVsActual(budgetId) {
    const budget = await budgetRepository.getBudgetById(budgetId);
    if (!budget) {
      throw new AppError('Budget not found', 404, 'BUDGET_NOT_FOUND');
    }

    const expenses = await getBudgetExpenses(budgetId);
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
    const allCategories = new Set([
      ...Object.keys(breakdown),
      ...Object.keys(actual)
    ]);

    allCategories.forEach((category) => {
      const planned = breakdown[category] || 0;
      const spent = actual[category] || 0;
      variance[category] = {
        planned,
        actual: spent,
        difference: spent - planned,
        variancePercent:
          planned > 0 ? (((spent - planned) / planned) * 100).toFixed(2) : 'N/A'
      };
    });

    return {
      budgetId,
      breakdown,
      actual,
      variance
    };
  }

  return {
    createBudget,
    getBudgetById,
    getEventBudget,
    deleteEventBudget,
    updateBudget,
    approveBudget,
    rejectBudget,
    logExpense,
    getBudgetExpenses,
    getExpenseById,
    updateExpense,
    markExpenseAsPaid,
    getTotalExpenses,
    getBudgetSummary,
    getBudgetVsActual
  };
}

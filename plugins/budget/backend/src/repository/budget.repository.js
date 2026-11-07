import mongoose from 'mongoose';
import { Budget, Expense } from '../schema/budget.model.js';

export function createBudgetRepository() {
  async function createBudget(budgetData) {
    const budget = await Budget.create(budgetData);
    return budget.toObject();
  }

  async function getBudgetById(budgetId) {
    return Budget.findById(budgetId).lean().exec();
  }

  async function getBudgetByEventId(eventId) {
    return Budget.findOne({ eventId }).lean().exec();
  }

  async function deleteBudget(budgetId) {
    await Expense.deleteMany({ budgetId });
    const result = await Budget.deleteOne({ _id: budgetId });
    return result.deletedCount > 0;
  }

  async function updateBudget(budgetId, updateData) {
    return Budget.findByIdAndUpdate(
      budgetId,
      { $set: updateData },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();
  }

  let _budgetTransactionsSupported = null;

  async function _logExpenseDirect(budgetId, expenseData) {
    const budget = await Budget.findById(budgetId).lean().exec();
    if (!budget) {
      throw new Error('Budget not found');
    }

    const result = await Expense.aggregate([
      { $match: { budgetId: budget._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const currentTotal = result[0]?.total || 0;
    if (currentTotal + expenseData.amount > budget.totalAllocation) {
      throw new Error(
        `Expense exceeds budget. Remaining: ${budget.totalAllocation - currentTotal}`
      );
    }

    const [expense] = await Expense.create([{ ...expenseData, budgetId }]);
    return expense.toObject();
  }

  async function logExpenseAtomic(budgetId, expenseData, budgetDoc) {
    if (_budgetTransactionsSupported === false) {
      return _logExpenseDirect(budgetId, expenseData);
    }

    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch {
      _budgetTransactionsSupported = false;
      if (session) {
        try {
          session.endSession();
        } catch {}
      }
      return _logExpenseDirect(budgetId, expenseData);
    }

    try {
      // Re-fetch budget within transaction to lock it (if using causal consistency)
      const budget = await Budget.findById(budgetId)
        .session(session)
        .lean()
        .exec();
      if (!budget) {
        throw new Error('Budget not found');
      }

      const result = await Expense.aggregate([
        { $match: { budgetId: budget._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).session(session);

      const currentTotal = result[0]?.total || 0;
      if (currentTotal + expenseData.amount > budget.totalAllocation) {
        throw new Error(
          `Expense exceeds budget. Remaining: ${budget.totalAllocation - currentTotal}`
        );
      }

      const [expense] = await Expense.create([{ ...expenseData, budgetId }], {
        session
      });

      await session.commitTransaction();
      _budgetTransactionsSupported = true;
      return expense.toObject();
    } catch (error) {
      if (session) {
        await session.abortTransaction().catch(() => {});
      }

      const isReplicaSetError =
        error?.code === 20 ||
        error?.codeName === 'IllegalOperation' ||
        error?.errorResponse?.code === 20 ||
        error?.originalError?.code === 20 ||
        String(error?.message || '').includes('replica set') ||
        String(error?.message || '').includes('Transaction numbers') ||
        String(error?.errorResponse?.errmsg || '').includes('replica set');

      if (isReplicaSetError) {
        _budgetTransactionsSupported = false;
        return _logExpenseDirect(budgetId, expenseData);
      }

      throw error;
    } finally {
      if (session) {
        try {
          session.endSession();
        } catch {}
      }
    }
  }

  async function getExpensesByBudget(budgetId) {
    return Expense.find({ budgetId }).lean().exec();
  }

  async function getExpenseById(expenseId) {
    return Expense.findById(expenseId).lean().exec();
  }

  async function updateExpense(expenseId, updateData) {
    return Expense.findByIdAndUpdate(
      expenseId,
      { $set: updateData },
      { returnDocument: 'after' }
    )
      .lean()
      .exec();
  }

  async function getTotalExpenses(budgetId) {
    const result = await Expense.aggregate([
      { $match: { budgetId: new mongoose.Types.ObjectId(budgetId) } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).exec();
    return result[0]?.total || 0;
  }

  async function getClubIdByBudgetId(budgetId) {
    if (!budgetId || !mongoose.Types.ObjectId.isValid(budgetId)) return null;
    try {
      const budget = await Budget.findById(budgetId)
        .populate('eventId', 'clubId')
        .lean()
        .exec();
      return (
        budget?.clubId?.toString() ||
        budget?.eventId?.clubId?.toString() ||
        null
      );
    } catch {
      return null;
    }
  }

  async function getBudgetIdByExpenseId(expenseId) {
    if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) return null;
    try {
      const expense = await Expense.findById(expenseId)
        .select('budgetId')
        .lean()
        .exec();
      return expense?.budgetId?.toString() || null;
    } catch {
      return null;
    }
  }

  return {
    createBudget,
    getBudgetById,
    getBudgetByEventId,
    deleteBudget,
    updateBudget,
    logExpenseAtomic,
    getExpensesByBudget,
    getExpenseById,
    updateExpense,
    getTotalExpenses,
    getClubIdByBudgetId,
    getBudgetIdByExpenseId
  };
}

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

  async function logExpenseAtomic(budgetId, expenseData, budgetDoc) {
    const session = await mongoose.startSession();
    session.startTransaction();
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
      session.endSession();
      return expense.toObject();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
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
    getTotalExpenses
  };
}

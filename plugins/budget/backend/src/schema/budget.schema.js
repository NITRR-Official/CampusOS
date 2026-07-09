/**
 * Budget Schema
 * Mongoose schema for budget and expense tracking
 */

import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    eventId: {
      type: String,
      required: true,
      unique: true
    },
    totalAllocation: {
      type: Number,
      required: true,
      min: 0
    },
    budgetBreakdown: [
      {
        category: String,
        amount: Number,
        description: String
      }
    ],
    currency: {
      type: String,
      default: 'INR'
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'approved', 'rejected'],
      default: 'draft'
    },
    approvedBy: String,
    approvedDate: Date,
    notes: String
  },
  {
    timestamps: true,
    collection: 'budgets'
  }
);

const expenseSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    budgetId: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    vendor: String,
    paymentMethod: {
      type: String,
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paidDate: Date,
    receipt: String,
    approvedBy: String,
    notes: String
  },
  {
    timestamps: true,
    collection: 'expenses'
  }
);

// Indexes
budgetSchema.index({ approvalStatus: 1 });

expenseSchema.index({ category: 1 });
expenseSchema.index({ paymentStatus: 1 });

export const Budget = mongoose.model('Budget', budgetSchema);
export const Expense = mongoose.model('Expense', expenseSchema);

export default { Budget, Expense };

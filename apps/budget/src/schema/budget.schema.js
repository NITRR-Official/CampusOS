/**
 * Budget Schema
 * Defines the structure for budget allocation and expense tracking
 */

export const BudgetSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier (UUID)'
  },
  eventId: {
    type: 'string',
    required: true,
    description: 'Reference to Event'
  },
  totalAllocation: {
    type: 'number',
    required: true,
    description: 'Total budget allocated for event'
  },
  budgetBreakdown: {
    type: 'array',
    items: {
      category: 'string',
      amount: 'number',
      description: 'string'
    },
    description: 'Breakdown of budget by category'
  },
  currency: {
    type: 'string',
    default: 'INR',
    description: 'Currency code'
  },
  approvalStatus: {
    type: 'string',
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft',
    description: 'Budget approval status'
  },
  approvedBy: {
    type: 'string',
    nullable: true,
    description: 'User ID who approved the budget'
  },
  approvedDate: {
    type: 'date',
    nullable: true,
    description: 'Date when budget was approved'
  },
  notes: {
    type: 'string',
    nullable: true,
    description: 'Additional budget notes'
  },
  createdAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  }
};

export const ExpenseSchema = {
  id: {
    type: 'string',
    required: true,
    description: 'Unique identifier (UUID)'
  },
  budgetId: {
    type: 'string',
    required: true,
    description: 'Reference to Budget'
  },
  category: {
    type: 'string',
    enum: ['vendor', 'resource', 'supplies', 'personnel', 'other'],
    required: true,
    description: 'Expense category'
  },
  description: {
    type: 'string',
    required: true,
    description: 'Detailed description of expense'
  },
  amount: {
    type: 'number',
    required: true,
    description: 'Expense amount'
  },
  vendor: {
    type: 'string',
    nullable: true,
    description: 'Vendor or recipient name'
  },
  paymentMethod: {
    type: 'string',
    enum: ['cash', 'check', 'transfer', 'card', 'pending'],
    default: 'pending',
    description: 'Payment method'
  },
  paymentStatus: {
    type: 'string',
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
    description: 'Payment status'
  },
  paidDate: {
    type: 'date',
    nullable: true,
    description: 'Date when expense was paid'
  },
  receipt: {
    type: 'string',
    nullable: true,
    description: 'Receipt file reference/URL'
  },
  approvedBy: {
    type: 'string',
    nullable: true,
    description: 'User ID who approved expense'
  },
  notes: {
    type: 'string',
    nullable: true,
    description: 'Additional notes'
  },
  createdAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  },
  updatedAt: {
    type: 'date',
    required: true,
    default: () => new Date()
  }
};

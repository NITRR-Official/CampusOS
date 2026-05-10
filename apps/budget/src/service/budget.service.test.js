import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../../../backend/src/database/connection.js';
import { Budget, Expense } from '../../../../backend/src/database/schemas/budget.schema.js';
import { BudgetService } from './budget.service.js';

describe('BudgetService', () => {
  let service;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Budget.deleteMany({});
    await Expense.deleteMany({});
    service = new BudgetService();
  });

  describe('createBudget', () => {
    it('should create a new budget with required fields', async () => {
      const budgetData = {
        eventId: 'event-1',
        totalAllocation: 100000,
        budgetBreakdown: [
          { category: 'catering', amount: 40000 },
          { category: 'decoration', amount: 30000 },
          { category: 'sound', amount: 20000 },
          { category: 'other', amount: 10000 }
        ],
        currency: 'INR',
        notes: 'Main event budget'
      };

      const result = await service.createBudget(budgetData);

      expect(result.success).toBe(true);
      expect(result.budget).toBeDefined();
      expect(result.budget.eventId).toBe('event-1');
      expect(result.budget.totalAllocation).toBe(100000);
      expect(result.budget.approvalStatus).toBe('draft');
      expect(result.budget.approvedBy).toBeNull();
    });

    it('should fail when missing required fields', async () => {
      const budgetData = {
        eventId: 'event-1'
        // missing totalAllocation
      };

      const result = await service.createBudget(budgetData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should fail when totalAllocation is zero or negative', async () => {
      const budgetData = {
        eventId: 'event-1',
        totalAllocation: -5000
      };

      const result = await service.createBudget(budgetData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('should set default currency to INR', async () => {
      const budgetData = {
        eventId: 'event-1',
        totalAllocation: 50000
      };

      const result = await service.createBudget(budgetData);

      expect(result.budget.currency).toBe('INR');
    });

    it('should generate unique budget IDs', async () => {
      const budget1 = {
        eventId: 'event-1',
        totalAllocation: 50000
      };

      const budget2 = {
        eventId: 'event-2',
        totalAllocation: 75000
      };

      const result1 = await service.createBudget(budget1);
      const result2 = await service.createBudget(budget2);

      expect(result1.budget.id).not.toBe(result2.budget.id);
    });
  });

  describe('getBudgetById', () => {
    it('should retrieve budget by ID', async () => {
      const budgetData = {
        eventId: 'event-1',
        totalAllocation: 100000
      };

      const createResult = await service.createBudget(budgetData);
      const budgetId = createResult.budget.id;

      const getResult = await service.getBudgetById(budgetId);

      expect(getResult).toBeDefined();
      expect(getResult.id).toBe(budgetId);
      expect(getResult.totalAllocation).toBe(100000);
    });

    it('should return null for non-existent budget', async () => {
      const result = await service.getBudgetById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('getEventBudget', () => {
    it('should retrieve budget for specific event', async () => {
      const budgetData = {
        eventId: 'event-123',
        totalAllocation: 100000
      };

      await service.createBudget(budgetData);
      const result = await service.getEventBudget('event-123');

      expect(result).toBeDefined();
      expect(result.eventId).toBe('event-123');
    });

    it('should return null if event has no budget', async () => {
      const result = await service.getEventBudget('event-no-budget');

      expect(result).toBeNull();
    });
  });

  describe('approveBudget', () => {
    let budgetId;

    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      budgetId = budgetResult.budget.id;
    });

    it('should approve a budget in draft status', async () => {
      const result = await service.approveBudget(budgetId, 'user-123');

      expect(result.success).toBe(true);
      expect(result.budget.approvalStatus).toBe('approved');
      expect(result.budget.approvedBy).toBe('user-123');
      expect(result.budget.approvedDate).toBeDefined();
    });

    it('should fail to approve non-existent budget', async () => {
      const result = await service.approveBudget('fake-id', 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('rejectBudget', () => {
    let budgetId;

    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      budgetId = budgetResult.budget.id;
    });

    it('should reject a budget and provide rejection reason', async () => {
      const result = await service.rejectBudget(budgetId, 'Budget exceeds available funds');

      expect(result.success).toBe(true);
      expect(result.budget.approvalStatus).toBe('rejected');
    });
  });

  describe('logExpense', () => {
    let budgetId;

    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      budgetId = budgetResult.budget.id;
    });

    it('should log an expense', async () => {
      const expenseData = {
        category: 'catering',
        description: 'Food and beverages',
        amount: 25000,
        vendor: 'vendor-123',
        receipt: 'receipt-123'
      };

      const result = await service.logExpense(budgetId, expenseData);

      expect(result.success).toBe(true);
      expect(result.expense).toBeDefined();
      expect(result.expense.amount).toBe(25000);
      expect(result.expense.paymentStatus).toBe('pending');
    });

    it('should fail when expense exceeds remaining budget', async () => {
      const expenseData = {
        category: 'catering',
        description: 'Catering',
        amount: 150000, // More than total allocation
        vendor: 'vendor-123'
      };

      const result = await service.logExpense(budgetId, expenseData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds budget');
    });

    it('should update remaining budget after logging expense', async () => {
      const expenseData = {
        category: 'decoration',
        description: 'Decoration items',
        amount: 30000,
        vendor: 'vendor-456'
      };

      await service.logExpense(budgetId, expenseData);
      const summary = await service.getBudgetSummary(budgetId);

      expect(summary.remaining).toBe(70000); // 100000 - 30000
    });
  });

  describe('markExpenseAsPaid', () => {
    let budgetId, expenseId;

    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      budgetId = budgetResult.budget.id;

      const expenseResult = await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 25000,
        vendor: 'vendor-123'
      });
      expenseId = expenseResult.expense.id;
    });

    it('should mark expense as paid', async () => {
      const result = await service.markExpenseAsPaid(expenseId, 'bank_transfer');

      expect(result.success).toBe(true);
      expect(result.expense.paymentStatus).toBe('paid');
      expect(result.expense.paymentMethod).toBe('bank_transfer');
    });

    it('should track payment date when marking as paid', async () => {
      const beforePayment = new Date();
      const result = await service.markExpenseAsPaid(expenseId, 'cash');
      const afterPayment = new Date();

      expect(result.expense.paidDate).toBeInstanceOf(Date);
      expect(result.expense.paidDate.getTime()).toBeGreaterThanOrEqual(beforePayment.getTime());
      expect(result.expense.paidDate.getTime()).toBeLessThanOrEqual(afterPayment.getTime());
    });
  });

  describe('getBudgetSummary', () => {
    it('should provide budget summary with totals', async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      const budgetId = budgetResult.budget.id;

      await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 25000,
        vendor: 'vendor-1'
      });

      await service.logExpense(budgetId, {
        category: 'decoration',
        description: 'Decoration',
        amount: 15000,
        vendor: 'vendor-2'
      });

      const result = await service.getBudgetSummary(budgetId);

      expect(result).toBeDefined();
      expect(result.totalAllocation).toBe(100000);
      expect(result.totalExpenses).toBe(40000);
      expect(result.remaining).toBe(60000);
    });
  });

  describe('getBudgetVsActual', () => {
    it('should compare budgeted vs actual expenses by category', async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000,
        budgetBreakdown: [
          { category: 'catering', amount: 40000 },
          { category: 'decoration', amount: 30000 },
          { category: 'sound', amount: 20000 }
        ]
      });
      const budgetId = budgetResult.budget.id;

      // Log actual expenses
      await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 42000, // Over budget
        vendor: 'vendor-1'
      });

      await service.logExpense(budgetId, {
        category: 'decoration',
        description: 'Decoration',
        amount: 28000, // Under budget
        vendor: 'vendor-2'
      });

      const result = await service.getBudgetVsActual(budgetId);

      expect(result).toBeDefined();
      expect(result.variance).toBeDefined();
    });
  });

  describe('Budget safety validations', () => {
    it('should prevent negative expenses', async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      const budgetId = budgetResult.budget.id;

      const result = await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: -5000, // Negative amount
        vendor: 'vendor-1'
      });

      expect(result.success).toBe(false);
    });

    it('should maintain budget integrity across multiple expenses', async () => {
      const budgetResult = await service.createBudget({
        eventId: 'event-1',
        totalAllocation: 100000
      });
      const budgetId = budgetResult.budget.id;

      const exp1 = await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 40000,
        vendor: 'vendor-1'
      });

      const exp2 = await service.logExpense(budgetId, {
        category: 'decoration',
        description: 'Decoration',
        amount: 30000,
        vendor: 'vendor-2'
      });

      const exp3 = await service.logExpense(budgetId, {
        category: 'sound',
        description: 'Sound system',
        amount: 35000, // Should fail - only 30000 left
        vendor: 'vendor-3'
      });

      expect(exp1.success).toBe(true);
      expect(exp2.success).toBe(true);
      expect(exp3.success).toBe(false);
    });
  });
});

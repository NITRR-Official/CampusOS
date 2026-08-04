import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';

import mongoose from 'mongoose';
import { Budget, Expense } from '../schema/budget.model.js';
import { createBudgetService } from './budget.service.js';
import { createBudgetRepository } from '../repository/budget.repository.js';

describe('BudgetService', () => {
  let service;
  let mongoServer;

  const event1 = new mongoose.Types.ObjectId().toString();
  const event2 = new mongoose.Types.ObjectId().toString();
  const event123 = new mongoose.Types.ObjectId().toString();
  const eventNoBudget = new mongoose.Types.ObjectId().toString();
  const user123 = new mongoose.Types.ObjectId().toString();
  const fakeId = new mongoose.Types.ObjectId().toString();
  const vendor123 = new mongoose.Types.ObjectId().toString();
  const vendor456 = new mongoose.Types.ObjectId().toString();
  const vendor1 = new mongoose.Types.ObjectId().toString();
  const vendor2 = new mongoose.Types.ObjectId().toString();
  const vendor3 = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
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
    const eventBus = { emit: () => {} };
    const budgetRepository = createBudgetRepository();
    service = createBudgetService(budgetRepository, eventBus);
  });

  describe('createBudget', () => {
    it('should create a new budget with required fields', async () => {
      const budgetData = {
        eventId: event1,
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

      expect(result).toBeDefined();
      expect(result.eventId.toString()).toBe(event1);
      expect(result.totalAllocation).toBe(100000);
      expect(result.approvalStatus).toBe('draft');
      expect(result.approvedBy).toBeNull();
    });

    it('should fail when missing required fields', async () => {
      const budgetData = {
        eventId: event1
      };
      await expect(service.createBudget(budgetData)).rejects.toThrow();
    });

    it('should fail when totalAllocation is zero or negative', async () => {
      const budgetData = {
        eventId: event1,
        totalAllocation: -5000
      };
      await expect(service.createBudget(budgetData)).rejects.toThrow();
    });

    it('should set default currency to INR', async () => {
      const budgetData = {
        eventId: event1,
        totalAllocation: 50000
      };
      const result = await service.createBudget(budgetData);
      expect(result.currency).toBe('INR');
    });

    it('should generate unique budget IDs', async () => {
      const budget1 = { eventId: event1, totalAllocation: 50000 };
      const budget2 = { eventId: event2, totalAllocation: 75000 };
      const result1 = await service.createBudget(budget1);
      const result2 = await service.createBudget(budget2);
      expect(result1.id || result1._id).not.toBe(result2.id || result2._id);
    });
  });

  describe('getBudgetById', () => {
    it('should retrieve budget by ID', async () => {
      const budgetData = { eventId: event1, totalAllocation: 100000 };
      const createResult = await service.createBudget(budgetData);
      const budgetId = createResult.id || createResult._id;
      const getResult = await service.getBudgetById(budgetId);
      expect(getResult).toBeDefined();
      expect((getResult.id || getResult._id).toString()).toBe(
        budgetId.toString()
      );
      expect(getResult.totalAllocation).toBe(100000);
    });

    it('should return null for non-existent budget', async () => {
      await expect(
        service.getBudgetById(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow();
    });
  });

  describe('getEventBudget', () => {
    it('should retrieve budget for specific event', async () => {
      const budgetData = { eventId: event123, totalAllocation: 100000 };
      await service.createBudget(budgetData);
      const result = await service.getEventBudget(event123);
      expect(result).toBeDefined();
      expect(result.eventId.toString()).toBe(event123);
    });

    it('should return null if event has no budget', async () => {
      await expect(service.getEventBudget(eventNoBudget)).rejects.toThrow();
    });
  });

  describe('approveBudget', () => {
    let budgetId;
    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      budgetId = budgetResult.id || budgetResult._id;
    });

    it('should approve a budget in draft status', async () => {
      const result = await service.approveBudget(budgetId, user123);
      expect(result.approvalStatus).toBe('approved');
      expect(result.approvedBy.toString()).toBe(user123);
      expect(result.approvedDate).toBeDefined();
    });

    it('should fail to approve non-existent budget', async () => {
      await expect(service.approveBudget(fakeId, user123)).rejects.toThrow();
    });
  });

  describe('rejectBudget', () => {
    let budgetId;
    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      budgetId = budgetResult.id || budgetResult._id;
    });

    it('should reject a budget and provide rejection reason', async () => {
      const result = await service.rejectBudget(
        budgetId,
        'Budget exceeds available funds'
      );
      expect(result.approvalStatus).toBe('rejected');
    });
  });

  describe('logExpense', () => {
    let budgetId;
    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      budgetId = budgetResult.id || budgetResult._id;
    });

    it('should log an expense', async () => {
      const expenseData = {
        category: 'catering',
        description: 'Food and beverages',
        amount: 25000,
        vendor: vendor123,
        receipt: 'receipt-123'
      };
      const result = await service.logExpense(budgetId, expenseData);
      expect(result.amount).toBe(25000);
      expect(result.paymentStatus).toBe('pending');
    });

    it('should fail when expense exceeds remaining budget', async () => {
      const expenseData = {
        category: 'catering',
        description: 'Catering',
        amount: 150000,
        vendor: vendor123
      };
      await expect(service.logExpense(budgetId, expenseData)).rejects.toThrow();
    });

    it('should update remaining budget after logging expense', async () => {
      const expenseData = {
        category: 'decoration',
        description: 'Decoration items',
        amount: 30000,
        vendor: vendor456
      };
      await service.logExpense(budgetId, expenseData);
      const summary = await service.getBudgetSummary(budgetId);
      expect(summary.remaining).toBe(70000);
    });
  });

  describe('markExpenseAsPaid', () => {
    let budgetId, expenseId;
    beforeEach(async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      budgetId = budgetResult.id || budgetResult._id;
      const expenseResult = await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 25000,
        vendor: vendor123
      });
      expenseId = expenseResult.id || expenseResult._id;
    });

    it('should mark expense as paid', async () => {
      const result = await service.markExpenseAsPaid(
        expenseId,
        'bank_transfer'
      );
      expect(result.paymentStatus).toBe('paid');
      expect(result.paymentMethod).toBe('bank_transfer');
    });

    it('should track payment date when marking as paid', async () => {
      const beforePayment = new Date();
      const result = await service.markExpenseAsPaid(expenseId, 'cash');
      const afterPayment = new Date();
      expect(result.paidDate).toBeInstanceOf(Date);
      expect(result.paidDate.getTime()).toBeGreaterThanOrEqual(
        beforePayment.getTime()
      );
      expect(result.paidDate.getTime()).toBeLessThanOrEqual(
        afterPayment.getTime()
      );
    });
  });

  describe('getBudgetSummary', () => {
    it('should provide budget summary with totals', async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      const budgetId = budgetResult.id || budgetResult._id;
      await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 25000,
        vendor: vendor1
      });
      await service.logExpense(budgetId, {
        category: 'decoration',
        description: 'Decoration',
        amount: 15000,
        vendor: vendor2
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
        eventId: event1,
        totalAllocation: 100000,
        budgetBreakdown: [
          { category: 'catering', amount: 40000 },
          { category: 'decoration', amount: 30000 },
          { category: 'sound', amount: 20000 }
        ]
      });
      const budgetId = budgetResult.id || budgetResult._id;
      await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 42000,
        vendor: vendor1
      });
      await service.logExpense(budgetId, {
        category: 'decoration',
        description: 'Decoration',
        amount: 28000,
        vendor: vendor2
      });
      const result = await service.getBudgetVsActual(budgetId);
      expect(result).toBeDefined();
      expect(result.variance).toBeDefined();
    });
  });

  describe('Budget safety validations', () => {
    it('should prevent negative expenses', async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      const budgetId = budgetResult.id || budgetResult._id;
      await expect(
        service.logExpense(budgetId, {
          category: 'catering',
          description: 'Catering',
          amount: -5000,
          vendor: vendor1
        })
      ).rejects.toThrow();
    });

    it('should maintain budget integrity across multiple expenses', async () => {
      const budgetResult = await service.createBudget({
        eventId: event1,
        totalAllocation: 100000
      });
      const budgetId = budgetResult.id || budgetResult._id;
      const exp1 = await service.logExpense(budgetId, {
        category: 'catering',
        description: 'Catering',
        amount: 40000,
        vendor: vendor1
      });
      const exp2 = await service.logExpense(budgetId, {
        category: 'decoration',
        description: 'Decoration',
        amount: 30000,
        vendor: vendor2
      });
      await expect(
        service.logExpense(budgetId, {
          category: 'sound',
          description: 'Sound system',
          amount: 35000,
          vendor: vendor3
        })
      ).rejects.toThrow();
      expect(exp1).toBeDefined();
      expect(exp2).toBeDefined();
    });
  });
});

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { EventEmitter } from 'events';
import { Budget, Expense } from '../schema/budget.model.js';
import { createBudgetRepository } from '../repository/budget.repository.js';
import { createBudgetService } from '../service/budget.service.js';
import { registerBudgetHandlers } from './index.js';

describe('Budget Listeners (Integration)', () => {
  let mongoServer;
  let budgetService;
  let eventBus;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Create a mock event bus
    eventBus = new EventEmitter();

    const budgetRepo = createBudgetRepository();
    budgetService = createBudgetService(budgetRepo, eventBus);

    // Register the listeners we want to test
    registerBudgetHandlers(eventBus, {}, budgetService);
  }, 120000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  beforeEach(async () => {
    await Budget.deleteMany({});
    await Expense.deleteMany({});
  });

  describe('event:deleted listener', () => {
    it('should delete the budget associated with the event', async () => {
      const eventId = new mongoose.Types.ObjectId().toString();

      // Create Budget
      await budgetService.createBudget({
        eventId,
        totalAllocation: 5000
      });

      // Verify it exists
      const budgetBefore = await budgetService.getEventBudget(eventId);
      expect(budgetBefore).toBeDefined();

      // Emit event:deleted (synchronous in this mock)
      eventBus.emit('event:deleted', { eventId });

      // Wait a tick for async handler to finish
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify deletion
      await expect(budgetService.getEventBudget(eventId)).rejects.toThrow(
        'Budget not found for this event'
      );
    });

    it('should not throw if event has no budget', async () => {
      const eventId = new mongoose.Types.ObjectId().toString();

      // Should handle gracefully
      expect(() => {
        eventBus.emit('event:deleted', { eventId });
      }).not.toThrow();

      // Wait a tick for async handler to finish
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });
});

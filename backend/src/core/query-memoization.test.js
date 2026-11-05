import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestContext } from './request-context.js';
import { createTaskRepository } from '../../../plugins/task/backend/src/repository/task.repository.js';
import { createEventRepository } from '../../../plugins/event/backend/src/repository/event.repository.js';
import { createMemberService } from '../../../plugins/club/backend/src/service/member.service.js';
import { Task } from '../../../plugins/task/backend/src/schema/task.model.js';
import { Event } from '../../../plugins/event/backend/src/schema/event.model.js';

describe('RBAC & Entity Query Memoization (Issue #110)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (RequestContext.isActive()) {
      RequestContext.clear();
    }
  });

  describe('Task Query Reduction', () => {
    it('eliminates duplicate MongoDB queries when resolving task context then fetching in service/controller', async () => {
      const mockTask = {
        _id: 'task-123',
        id: 'task-123',
        title: 'Organize Workshop',
        clubId: 'club-999'
      };

      const findByIdSpy = vi.spyOn(Task, 'findById').mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockTask)
        })
      });

      const taskRepo = createTaskRepository();

      await RequestContext.run(new Map(), async () => {
        // 1. Context Resolver query (e.g. In registry.resolveContext)
        const docFromResolver = await taskRepo.findById('task-123');
        expect(docFromResolver).toEqual(mockTask);
        expect(findByIdSpy).toHaveBeenCalledTimes(1);

        // 2. Controller / Service query (e.g. In taskService.getTask)
        const docFromController = await taskRepo.findById('task-123');
        expect(docFromController).toEqual(mockTask);

        // Crucial: No duplicate query! Query count remains 1
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('queries DB fresh in a separate request context', async () => {
      const mockTask = { _id: 'task-123', clubId: 'club-999' };
      const findByIdSpy = vi.spyOn(Task, 'findById').mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockTask)
        })
      });

      const taskRepo = createTaskRepository();

      // Request 1
      await RequestContext.run(new Map(), async () => {
        await taskRepo.findById('task-123');
        await taskRepo.findById('task-123');
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
      });

      // Request 2 (New request boundary)
      await RequestContext.run(new Map(), async () => {
        await taskRepo.findById('task-123');
        expect(findByIdSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Event Query Reduction', () => {
    it('eliminates duplicate MongoDB queries when resolving event context then fetching in service/controller', async () => {
      const mockEvent = {
        _id: 'event-456',
        id: 'event-456',
        title: 'Annual Tech Fest',
        clubId: 'club-999'
      };

      const findByIdSpy = vi.spyOn(Event, 'findById').mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockEvent)
        })
      });

      const eventRepo = createEventRepository();

      await RequestContext.run(new Map(), async () => {
        // 1. Resolver query
        const docFromResolver = await eventRepo.getEventById('event-456');
        expect(docFromResolver).toEqual(mockEvent);
        expect(findByIdSpy).toHaveBeenCalledTimes(1);

        // 2. Subsequent controller query
        const docFromService = await eventRepo.getEventById('event-456');
        expect(docFromService).toEqual(mockEvent);

        // Crucial: Query count remains 1
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('RBAC Permission Memoization (member.service)', () => {
    it('memoizes user permissions across multiple checks in the same request', async () => {
      const mockClubRepo = {
        findMemberWithRoles: vi.fn().mockResolvedValue({
          userId: 'user-1',
          clubId: 'club-999',
          roles: [
            { name: 'Lead', permissions: ['task:manage', 'event:manage'] }
          ]
        })
      };

      const memberService = createMemberService(mockClubRepo, null, null);

      await RequestContext.run(new Map(), async () => {
        // Check 1: In permission guard
        const perms1 = await memberService.getUserPermissions(
          'user-1',
          'club-999'
        );
        expect(perms1).toEqual(['task:manage', 'event:manage']);
        expect(mockClubRepo.findMemberWithRoles).toHaveBeenCalledTimes(1);

        // Check 2: In another permission guard or controller handler
        const perms2 = await memberService.getUserPermissions(
          'user-1',
          'club-999'
        );
        expect(perms2).toEqual(['task:manage', 'event:manage']);

        // Crucial: Duplicate MongoDB lookup avoided!
        expect(mockClubRepo.findMemberWithRoles).toHaveBeenCalledTimes(1);
      });
    });
  });
});

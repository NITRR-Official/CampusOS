import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalendarService } from './calendar.service.js';

/**
 * Unit tests proving CalendarService delegates to the injected repository
 * abstraction (GitHub issues #43/#45/#46).
 *
 * These tests use NO database and NO mongodb-memory-server. They construct
 * `new CalendarService(fakeRepo)` with a stub repository built from vi.fn()
 * mocks, then assert that each service method:
 *   1. calls the correct repository method with the correct arguments, and
 *   2. returns exactly what the repository returns (no transformation), and
 *   3. propagates rejections rather than swallowing them.
 *
 * This validates the persistence-abstraction decoupling: the service owns no
 * persistence/normalization logic of its own.
 */

function createFakeRepository() {
  return {
    createEvent: vi.fn(),
    listEvents: vi.fn(),
    queryEventsByRange: vi.fn(),
    getEventById: vi.fn(),
    deleteEvent: vi.fn(),
    updateEvent: vi.fn()
  };
}

describe('CalendarService delegation to repository (no database)', () => {
  let fakeRepo;
  let service;

  beforeEach(() => {
    fakeRepo = createFakeRepository();
    service = new CalendarService(fakeRepo);
  });

  describe('createEvent -> repository.createEvent', () => {
    it('calls createEvent with the payload and returns its result', async () => {
      const payload = {
        title: 'Demo',
        eventType: 'event',
        startsAt: '2025-06-01T09:00:00.000Z',
        createdBy: 'user-1'
      };
      const sentinel = { id: 'evt-1' };
      fakeRepo.createEvent.mockResolvedValue(sentinel);

      const result = await service.createEvent(payload);

      expect(fakeRepo.createEvent).toHaveBeenCalledTimes(1);
      expect(fakeRepo.createEvent).toHaveBeenCalledWith(payload);
      expect(result).toBe(sentinel);
    });

    it('propagates repository rejection', async () => {
      const boom = new Error('create failed');
      fakeRepo.createEvent.mockRejectedValue(boom);

      await expect(service.createEvent({})).rejects.toBe(boom);
    });
  });

  describe('listEvents -> repository.listEvents', () => {
    it('calls listEvents and returns its result', async () => {
      const sentinel = [{ id: 'a' }, { id: 'b' }];
      fakeRepo.listEvents.mockResolvedValue(sentinel);

      const result = await service.listEvents();

      expect(fakeRepo.listEvents).toHaveBeenCalledTimes(1);
      expect(fakeRepo.listEvents).toHaveBeenCalledWith();
      expect(result).toBe(sentinel);
    });

    it('propagates repository rejection', async () => {
      const boom = new Error('list failed');
      fakeRepo.listEvents.mockRejectedValue(boom);

      await expect(service.listEvents()).rejects.toBe(boom);
    });
  });

  describe('getEventsBetween -> repository.queryEventsByRange', () => {
    it('calls queryEventsByRange with (startDate, endDate) and returns its result', async () => {
      const sentinel = [{ id: 'in-range' }];
      fakeRepo.queryEventsByRange.mockResolvedValue(sentinel);

      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-12-31T00:00:00.000Z';
      const result = await service.getEventsBetween(startDate, endDate);

      expect(fakeRepo.queryEventsByRange).toHaveBeenCalledTimes(1);
      expect(fakeRepo.queryEventsByRange).toHaveBeenCalledWith(
        startDate,
        endDate
      );
      // It must NOT call the wrong repository methods.
      expect(fakeRepo.listEvents).not.toHaveBeenCalled();
      expect(result).toBe(sentinel);
    });

    it('propagates repository rejection', async () => {
      const boom = new Error('range failed');
      fakeRepo.queryEventsByRange.mockRejectedValue(boom);

      await expect(service.getEventsBetween('a', 'b')).rejects.toBe(boom);
    });
  });

  describe('getEvent -> repository.getEventById', () => {
    it('calls getEventById with the id and returns its result', async () => {
      const sentinel = { id: 'evt-42' };
      fakeRepo.getEventById.mockResolvedValue(sentinel);

      const result = await service.getEvent('evt-42');

      expect(fakeRepo.getEventById).toHaveBeenCalledTimes(1);
      expect(fakeRepo.getEventById).toHaveBeenCalledWith('evt-42');
      expect(result).toBe(sentinel);
    });

    it('returns null exactly as the repository does', async () => {
      fakeRepo.getEventById.mockResolvedValue(null);
      expect(await service.getEvent('missing')).toBeNull();
    });

    it('propagates repository rejection', async () => {
      const boom = new Error('get failed');
      fakeRepo.getEventById.mockRejectedValue(boom);

      await expect(service.getEvent('x')).rejects.toBe(boom);
    });
  });

  describe('deleteEvent -> repository.deleteEvent', () => {
    it('calls deleteEvent with the id and returns its result', async () => {
      fakeRepo.deleteEvent.mockResolvedValue(true);

      const result = await service.deleteEvent('evt-9');

      expect(fakeRepo.deleteEvent).toHaveBeenCalledTimes(1);
      expect(fakeRepo.deleteEvent).toHaveBeenCalledWith('evt-9');
      expect(result).toBe(true);
    });

    it('returns false exactly as the repository does', async () => {
      fakeRepo.deleteEvent.mockResolvedValue(false);
      expect(await service.deleteEvent('missing')).toBe(false);
    });

    it('propagates repository rejection', async () => {
      const boom = new Error('delete failed');
      fakeRepo.deleteEvent.mockRejectedValue(boom);

      await expect(service.deleteEvent('x')).rejects.toBe(boom);
    });
  });

  it('does not call any repository method until a service method is invoked', () => {
    expect(fakeRepo.createEvent).not.toHaveBeenCalled();
    expect(fakeRepo.listEvents).not.toHaveBeenCalled();
    expect(fakeRepo.queryEventsByRange).not.toHaveBeenCalled();
    expect(fakeRepo.getEventById).not.toHaveBeenCalled();
    expect(fakeRepo.deleteEvent).not.toHaveBeenCalled();
  });
});

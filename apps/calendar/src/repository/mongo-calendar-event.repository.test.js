import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} from 'vitest';
import fc from 'fast-check';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '../../../../backend/src/database/connection.js';
import { CalendarEvent } from '../schema/calendar.model.js';
import { MongoCalendarEventRepository } from './mongo-calendar-event.repository.js';

/**
 * Integration tests for {@link MongoCalendarEventRepository} (GitHub issue #46).
 *
 * These tests exercise the concrete MongoDB adapter directly against an
 * in-memory MongoDB instance (mongodb-memory-server). They cover the full CRUD
 * surface of the repository contract - including updateEvent, which the
 * service-level suite does not exercise - plus normalization, ordering, range
 * filtering, and falsy-id handling.
 */

const NUM_RUNS = 100;
const LONG_TIMEOUT = 120000;

const EXPECTED_KEYS = [
  'id',
  'title',
  'eventType',
  'startsAt',
  'endsAt',
  'description',
  'linkedTaskId',
  'linkedEventId',
  'createdBy',
  'createdAt',
  'updatedAt'
].sort();

const DATE_MIN = new Date('2000-01-01T00:00:00.000Z');
const DATE_MAX = new Date('2099-12-31T23:59:59.999Z');

// Title generator stable under trim() so exact equality holds.
const titleArb = fc
  .string({ minLength: 3, maxLength: 140 })
  .map((s) => s.replace(/\s/g, 'x'))
  .filter((s) => s.length >= 3 && s.length <= 140);

const createdByArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .map((s) => s.replace(/\s/g, 'x'))
  .filter((s) => s.length >= 1);

const eventTypeArb = fc.constantFrom('task-deadline', 'event', 'milestone');

const optionalStringArb = fc.option(
  fc.string({ maxLength: 60 }).map((s) => s.replace(/\s/g, 'x')),
  { nil: undefined }
);

// Generates a valid create payload. endsAt (when present) is >= startsAt.
const validPayloadArb = fc
  .record({
    title: titleArb,
    eventType: eventTypeArb,
    start: fc.date({ min: DATE_MIN, max: DATE_MAX }),
    endOffset: fc.option(
      fc.integer({ min: 0, max: 1000 * 60 * 60 * 24 * 30 }),
      { nil: undefined }
    ),
    description: optionalStringArb,
    linkedTaskId: optionalStringArb,
    linkedEventId: optionalStringArb,
    createdBy: createdByArb
  })
  .map((r) => ({
    title: r.title,
    eventType: r.eventType,
    startsAt: r.start.toISOString(),
    endsAt:
      r.endOffset === undefined
        ? undefined
        : new Date(r.start.getTime() + r.endOffset).toISOString(),
    description: r.description,
    linkedTaskId: r.linkedTaskId,
    linkedEventId: r.linkedEventId,
    createdBy: r.createdBy
  }));

describe('MongoCalendarEventRepository (integration)', () => {
  let repository;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, LONG_TIMEOUT);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, LONG_TIMEOUT);

  beforeEach(async () => {
    await CalendarEvent.deleteMany({});
    repository = new MongoCalendarEventRepository();
  });

  const samplePayload = {
    title: 'Sample Event',
    eventType: 'event',
    startsAt: '2025-06-01T09:00:00.000Z',
    createdBy: 'user-1'
  };

  // ---------------------------------------------------------------------------
  // createEvent
  // ---------------------------------------------------------------------------
  describe('createEvent', () => {
    it('persists and returns a normalized event with exactly the 11 keys', async () => {
      const created = await repository.createEvent({
        title: 'Team Sync',
        eventType: 'event',
        startsAt: '2025-06-01T09:00:00.000Z',
        endsAt: '2025-06-01T10:00:00.000Z',
        description: 'weekly',
        linkedTaskId: 'task-1',
        linkedEventId: 'event-1',
        createdBy: 'user-7'
      });

      expect(Object.keys(created).sort()).toEqual(EXPECTED_KEYS);
      expect(Object.prototype.hasOwnProperty.call(created, '_id')).toBe(false);

      expect(typeof created.id).toBe('string');
      expect(created.id.length).toBeGreaterThan(0);
      expect(created.title).toBe('Team Sync');
      expect(created.eventType).toBe('event');
      expect(created.description).toBe('weekly');
      expect(created.linkedTaskId).toBe('task-1');
      expect(created.linkedEventId).toBe('event-1');
      expect(created.createdBy).toBe('user-7');

      // Date fields are ISO strings re-parsing to the same instant.
      for (const field of ['startsAt', 'endsAt', 'createdAt', 'updatedAt']) {
        expect(typeof created[field]).toBe('string');
        expect(new Date(created[field]).toISOString()).toBe(created[field]);
      }

      // Persisted exactly one document.
      expect(await CalendarEvent.countDocuments()).toBe(1);
    });

    it('preserves nulls for omitted optional fields', async () => {
      const created = await repository.createEvent(samplePayload);

      expect(created.endsAt).toBeNull();
      expect(created.description).toBeNull();
      expect(created.linkedTaskId).toBeNull();
      expect(created.linkedEventId).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getEventById
  // ---------------------------------------------------------------------------
  describe('getEventById', () => {
    it('returns the event for a known id', async () => {
      const created = await repository.createEvent(samplePayload);
      const found = await repository.getEventById(created.id);
      expect(found).toEqual(created);
    });

    it('returns null for an unknown id', async () => {
      expect(await repository.getEventById('does-not-exist')).toBeNull();
    });

    it('returns null for falsy ids (null/undefined/empty string)', async () => {
      expect(await repository.getEventById(null)).toBeNull();
      expect(await repository.getEventById(undefined)).toBeNull();
      expect(await repository.getEventById('')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // listEvents
  // ---------------------------------------------------------------------------
  describe('listEvents', () => {
    it('returns [] when there are no events', async () => {
      expect(await repository.listEvents()).toEqual([]);
    });

    it('returns all events ordered by startsAt asc then id asc', async () => {
      // Two events share a startsAt to exercise the id tie-break.
      await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-09-01T00:00:00.000Z'
      });
      await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-03-01T00:00:00.000Z'
      });
      const tieA = await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-06-01T00:00:00.000Z'
      });
      const tieB = await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-06-01T00:00:00.000Z'
      });

      const events = await repository.listEvents();
      expect(events).toHaveLength(4);

      for (let i = 1; i < events.length; i += 1) {
        const prevT = Date.parse(events[i - 1].startsAt);
        const curT = Date.parse(events[i].startsAt);
        expect(prevT).toBeLessThanOrEqual(curT);
        if (prevT === curT) {
          expect(events[i - 1].id <= events[i].id).toBe(true);
        }
      }

      // The two tied events appear ordered by id.
      const [lowId, highId] = [tieA.id, tieB.id].sort();
      const tiedIds = events
        .filter((e) => e.startsAt === '2025-06-01T00:00:00.000Z')
        .map((e) => e.id);
      expect(tiedIds).toEqual([lowId, highId]);
    });
  });

  // ---------------------------------------------------------------------------
  // queryEventsByRange
  // ---------------------------------------------------------------------------
  describe('queryEventsByRange', () => {
    it('returns exactly the events with startsAt inside the inclusive range, ordered', async () => {
      await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-01-01T00:00:00.000Z'
      });
      const inLow = await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-06-01T00:00:00.000Z'
      });
      const inHigh = await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-06-30T00:00:00.000Z'
      });
      await repository.createEvent({
        ...samplePayload,
        startsAt: '2025-12-01T00:00:00.000Z'
      });

      // Inclusive bounds match exactly the boundary events.
      const result = await repository.queryEventsByRange(
        '2025-06-01T00:00:00.000Z',
        '2025-06-30T00:00:00.000Z'
      );

      expect(result.map((e) => e.id)).toEqual([inLow.id, inHigh.id]);

      for (let i = 1; i < result.length; i += 1) {
        expect(Date.parse(result[i - 1].startsAt)).toBeLessThanOrEqual(
          Date.parse(result[i].startsAt)
        );
      }
    });

    it('returns [] when nothing matches the range', async () => {
      await repository.createEvent(samplePayload);
      const result = await repository.queryEventsByRange(
        '2030-01-01T00:00:00.000Z',
        '2030-12-31T00:00:00.000Z'
      );
      expect(result).toEqual([]);
    });

    it('returns [] when start is later than end', async () => {
      await repository.createEvent(samplePayload);
      const result = await repository.queryEventsByRange(
        '2025-12-31T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z'
      );
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // updateEvent (previously untested method)
  // ---------------------------------------------------------------------------
  describe('updateEvent', () => {
    it('applies partial changes and returns the updated normalized event', async () => {
      const created = await repository.createEvent(samplePayload);

      const updated = await repository.updateEvent(created.id, {
        title: 'Renamed Event',
        description: 'now has a description'
      });

      expect(updated).not.toBeNull();
      expect(Object.keys(updated).sort()).toEqual(EXPECTED_KEYS);
      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe('Renamed Event');
      expect(updated.description).toBe('now has a description');
      // Untouched fields are preserved.
      expect(updated.eventType).toBe(created.eventType);
      expect(updated.startsAt).toBe(created.startsAt);
      expect(updated.createdBy).toBe(created.createdBy);
    });

    it('persists the change so a subsequent getEventById reflects it', async () => {
      const created = await repository.createEvent(samplePayload);
      await repository.updateEvent(created.id, { title: 'Persisted Title' });

      const reread = await repository.getEventById(created.id);
      expect(reread.title).toBe('Persisted Title');
    });

    it('changes updatedAt while preserving createdAt', async () => {
      const created = await repository.createEvent(samplePayload);

      // Ensure a measurable time gap so updatedAt advances.
      await new Promise((resolve) => setTimeout(resolve, 20));

      const updated = await repository.updateEvent(created.id, {
        title: 'Touched'
      });

      expect(updated.createdAt).toBe(created.createdAt);
      expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(created.updatedAt)
      );
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('returns null for an unknown id', async () => {
      expect(
        await repository.updateEvent('does-not-exist', { title: 'x' })
      ).toBeNull();
    });

    it('returns null for falsy ids without throwing', async () => {
      expect(await repository.updateEvent(null, { title: 'x' })).toBeNull();
      expect(await repository.updateEvent(undefined, { title: 'x' })).toBeNull();
      expect(await repository.updateEvent('', { title: 'x' })).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteEvent
  // ---------------------------------------------------------------------------
  describe('deleteEvent', () => {
    it('returns true and removes an existing event', async () => {
      const created = await repository.createEvent(samplePayload);

      expect(await repository.deleteEvent(created.id)).toBe(true);
      expect(await repository.getEventById(created.id)).toBeNull();
      expect(await CalendarEvent.countDocuments()).toBe(0);
    });

    it('returns false for an unknown id', async () => {
      expect(await repository.deleteEvent('does-not-exist')).toBe(false);
    });

    it('returns false for falsy ids (null/undefined/empty string)', async () => {
      const created = await repository.createEvent(samplePayload);

      expect(await repository.deleteEvent(null)).toBe(false);
      expect(await repository.deleteEvent(undefined)).toBe(false);
      expect(await repository.deleteEvent('')).toBe(false);

      // Existing record untouched.
      expect(await CalendarEvent.countDocuments()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Property-based tests
  // ---------------------------------------------------------------------------
  describe('properties', () => {
    it(
      'Property: createEvent then getEventById preserves all fields (round-trip)',
      async () => {
        // PROPERTY TEST - repository round-trip fidelity.
        await fc.assert(
          fc.asyncProperty(validPayloadArb, async (payload) => {
            await CalendarEvent.deleteMany({});
            const created = await repository.createEvent(payload);
            const read = await repository.getEventById(created.id);

            expect(read).toEqual(created);
            expect(Object.keys(read).sort()).toEqual(EXPECTED_KEYS);
            expect(read.title).toBe(payload.title);
            expect(read.eventType).toBe(payload.eventType);
            expect(read.startsAt).toBe(new Date(payload.startsAt).toISOString());
            expect(read.createdBy).toBe(payload.createdBy);
          }),
          { numRuns: NUM_RUNS }
        );
      },
      LONG_TIMEOUT
    );

    it(
      'Property: queryEventsByRange returns exactly the in-range events',
      async () => {
        // PROPERTY TEST - range-filter correctness against a brute-force oracle.
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              payloads: fc.array(validPayloadArb, {
                minLength: 0,
                maxLength: 8
              }),
              start: fc.date({ min: DATE_MIN, max: DATE_MAX }),
              end: fc.date({ min: DATE_MIN, max: DATE_MAX })
            }),
            async ({ payloads, start, end }) => {
              await CalendarEvent.deleteMany({});
              for (const payload of payloads) {
                await repository.createEvent(payload);
              }

              const startIso = start.toISOString();
              const endIso = end.toISOString();
              const result = await repository.queryEventsByRange(
                startIso,
                endIso
              );

              const all = await repository.listEvents();
              const s = start.getTime();
              const e = end.getTime();
              const expected = all.filter((ev) => {
                const t = Date.parse(ev.startsAt);
                return t >= s && t <= e;
              });

              expect(result.map((r) => r.id)).toEqual(
                expected.map((r) => r.id)
              );

              if (s > e) {
                expect(result).toEqual([]);
              }
            }
          ),
          { numRuns: NUM_RUNS }
        );
      },
      LONG_TIMEOUT
    );
  });
});

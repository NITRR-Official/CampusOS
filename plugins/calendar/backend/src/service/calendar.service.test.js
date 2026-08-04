import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fc from 'fast-check';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { CalendarEvent } from '../schema/calendar.model.js';
import { getCalendarService } from './calendar.service.js';

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

// A title generator that is stable under trim() (no leading/trailing
// whitespace) so we can assert exact equality against the supplied payload.
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

// Generates a valid calendar payload. endsAt (when present) is >= startsAt.
const validPayloadArb = fc
  .record({
    title: titleArb,
    eventType: eventTypeArb,
    start: fc.date({ min: DATE_MIN, max: DATE_MAX }),
    endOffset: fc.option(
      fc.integer({ min: 0, max: 1000 * 60 * 60 * 24 * 30 }),
      {
        nil: undefined
      }
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

// A pool of timestamps (with intentional duplicates) to force startsAt ties so
// the id tie-break ordering is exercised.
const tiePoolArb = fc.constantFrom(
  '2025-01-01T00:00:00.000Z',
  '2025-06-15T12:30:00.000Z',
  '2025-06-15T12:30:00.000Z',
  '2025-12-31T23:59:00.000Z'
);

const orderingPayloadArb = fc
  .record({
    title: titleArb,
    eventType: eventTypeArb,
    startsAt: tiePoolArb,
    createdBy: createdByArb
  })
  .map((r) => ({ ...r }));

describe('CalendarService (MongoDB-backed)', () => {
  let service;
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
    service = getCalendarService();
  });

  // ---------------------------------------------------------------------------
  // Property-based tests
  // ---------------------------------------------------------------------------

  it(
    'Property 1: persistence round-trip preserves all fields',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 1: Persistence round-trip preserves all fields
      // Validates: Requirements 1.1, 1.2, 1.5, 7.1
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          await CalendarEvent.deleteMany({});
          const created = await service.createEvent(payload);
          const read = await service.getEvent(created.id);
          expect(read).toEqual(created);
        }),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 2: create persists exactly one event and preserves supplied fields',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 2: Create persists exactly one event and preserves supplied fields
      // Validates: Requirements 4.1, 4.3, 4.8, 2.2
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          await CalendarEvent.deleteMany({});
          const before = await CalendarEvent.countDocuments();
          const created = await service.createEvent(payload);
          const after = await CalendarEvent.countDocuments();

          expect(after - before).toBe(1);
          expect(typeof created.id).toBe('string');
          expect(created.id.length).toBeGreaterThan(0);
          expect(created.title).toBe(payload.title);
          expect(created.eventType).toBe(payload.eventType);
          expect(created.startsAt).toBe(
            new Date(payload.startsAt).toISOString()
          );
          expect(created.createdBy).toBe(payload.createdBy);
        }),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 3: created event identifiers are unique non-empty strings',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 3: Created event identifiers are unique
      // Validates: Requirements 4.2
      await fc.assert(
        fc.asyncProperty(
          fc.array(validPayloadArb, { minLength: 1, maxLength: 8 }),
          async (payloads) => {
            await CalendarEvent.deleteMany({});
            const ids = [];
            for (const payload of payloads) {
              const created = await service.createEvent(payload);
              ids.push(created.id);
            }

            for (const id of ids) {
              expect(typeof id).toBe('string');
              expect(id.length).toBeGreaterThan(0);
            }
            expect(new Set(ids).size).toBe(ids.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 4: omitted optional fields default to null',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 4: Omitted optional fields default to null
      // Validates: Requirements 2.6, 4.4, 4.5, 4.6, 4.7
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          await CalendarEvent.deleteMany({});
          const created = await service.createEvent(payload);
          const read = await service.getEvent(created.id);

          for (const field of [
            'endsAt',
            'description',
            'linkedTaskId',
            'linkedEventId'
          ]) {
            if (payload[field] === undefined) {
              expect(created[field]).toBeNull();
              expect(read[field]).toBeNull();
            }
          }
        }),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 5: creation timestamps are present and equal',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 5: Creation timestamps are present and equal
      // Validates: Requirements 2.7, 4.9
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          await CalendarEvent.deleteMany({});
          const created = await service.createEvent(payload);

          expect(created.createdAt).toBeTruthy();
          expect(created.updatedAt).toBeTruthy();
          expect(created.createdAt).toBe(created.updatedAt);
        }),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 6: list returns every stored event exactly once',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 6: List returns every stored event exactly once
      // Validates: Requirements 5.1
      await fc.assert(
        fc.asyncProperty(
          fc.array(validPayloadArb, { minLength: 0, maxLength: 8 }),
          async (payloads) => {
            await CalendarEvent.deleteMany({});
            const createdIds = [];
            for (const payload of payloads) {
              const created = await service.createEvent(payload);
              createdIds.push(created.id);
            }

            const list = await service.listEvents();
            const listIds = list.map((e) => e.id);

            expect(listIds.slice().sort()).toEqual(createdIds.slice().sort());
            expect(new Set(listIds).size).toBe(listIds.length);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 7: query results are ordered by startsAt then id',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 7: Query results are ordered by startsAt then id
      // Validates: Requirements 5.2, 6.2
      await fc.assert(
        fc.asyncProperty(
          fc.array(orderingPayloadArb, { minLength: 0, maxLength: 10 }),
          async (payloads) => {
            await CalendarEvent.deleteMany({});
            for (const payload of payloads) {
              await service.createEvent(payload);
            }

            const listed = await service.listEvents();
            const ranged = await service.getEventsBetween(
              '2000-01-01T00:00:00.000Z',
              '2099-12-31T23:59:59.999Z'
            );

            for (const events of [listed, ranged]) {
              for (let i = 1; i < events.length; i += 1) {
                const prev = events[i - 1];
                const cur = events[i];
                const prevT = Date.parse(prev.startsAt);
                const curT = Date.parse(cur.startsAt);

                expect(prevT).toBeLessThanOrEqual(curT);
                if (prevT === curT) {
                  expect(prev.id <= cur.id).toBe(true);
                }
              }
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 8: range query returns exactly the events within inclusive bounds',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 8: Range query returns exactly the events within inclusive bounds
      // Validates: Requirements 6.1, 6.3, 6.4
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            payloads: fc.array(validPayloadArb, { minLength: 0, maxLength: 8 }),
            start: fc.date({ min: DATE_MIN, max: DATE_MAX }),
            end: fc.date({ min: DATE_MIN, max: DATE_MAX })
          }),
          async ({ payloads, start, end }) => {
            await CalendarEvent.deleteMany({});
            for (const payload of payloads) {
              await service.createEvent(payload);
            }

            const startIso = start.toISOString();
            const endIso = end.toISOString();
            const result = await service.getEventsBetween(startIso, endIso);

            const all = await service.listEvents();
            const s = start.getTime();
            const e = end.getTime();
            const expected = all.filter((ev) => {
              const t = Date.parse(ev.startsAt);
              return t >= s && t <= e;
            });

            expect(result.map((r) => r.id).sort()).toEqual(
              expected.map((r) => r.id).sort()
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

  it(
    'Property 9: delete removes the targeted event',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 9: Delete removes the targeted event
      // Validates: Requirements 8.1, 8.3
      await fc.assert(
        fc.asyncProperty(validPayloadArb, async (payload) => {
          await CalendarEvent.deleteMany({});
          const created = await service.createEvent(payload);

          const deleted = await service.deleteEvent(created.id);
          expect(deleted).toBeTruthy();

          const afterDelete = await service.getEvent(created.id);
          expect(afterDelete).toBeNull();
        }),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  it(
    'Property 10: serialization yields the exact response shape',
    async () => {
      // Feature: persistent-calendar-event-storage, Property 10: Serialization yields the exact response shape
      // Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
      await fc.assert(
        fc.asyncProperty(
          fc.array(validPayloadArb, { minLength: 1, maxLength: 6 }),
          async (payloads) => {
            await CalendarEvent.deleteMany({});
            for (const payload of payloads) {
              await service.createEvent(payload);
            }

            const listed = await service.listEvents();
            const ranged = await service.getEventsBetween(
              '2000-01-01T00:00:00.000Z',
              '2099-12-31T23:59:59.999Z'
            );

            for (const collection of [listed, ranged]) {
              for (const ev of collection) {
                // Exactly the 11 keys, no _id, no extras.
                expect(Object.keys(ev).sort()).toEqual(EXPECTED_KEYS);
                expect(Object.prototype.hasOwnProperty.call(ev, '_id')).toBe(
                  false
                );

                // Non-null date fields are ISO strings re-parsing to the same instant.
                for (const field of ['startsAt', 'createdAt', 'updatedAt']) {
                  expect(typeof ev[field]).toBe('string');
                  expect(new Date(ev[field]).toISOString()).toBe(ev[field]);
                }
                if (ev.endsAt !== null) {
                  expect(typeof ev.endsAt).toBe('string');
                  expect(new Date(ev.endsAt).toISOString()).toBe(ev.endsAt);
                }

                // Nullable fields are either a string value or JSON null.
                for (const field of [
                  'endsAt',
                  'description',
                  'linkedTaskId',
                  'linkedEventId'
                ]) {
                  expect(
                    ev[field] === null || typeof ev[field] === 'string'
                  ).toBe(true);
                }
              }
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    },
    LONG_TIMEOUT
  );

  // ---------------------------------------------------------------------------
  // Task 7.3 - Edge-case and required-behavior example tests
  // ---------------------------------------------------------------------------

  describe('edge cases and required behaviors', () => {
    const samplePayload = {
      title: 'Sample Event',
      eventType: 'event',
      startsAt: '2025-06-01T09:00:00.000Z',
      createdBy: 'user-1'
    };

    it('exposes exactly the five service methods (Req 3.1)', () => {
      for (const method of [
        'createEvent',
        'listEvents',
        'getEventsBetween',
        'getEvent',
        'deleteEvent'
      ]) {
        expect(typeof service[method]).toBe('function');
      }
    });

    it('listEvents returns [] for an empty store (Req 5.3)', async () => {
      const events = await service.listEvents();
      expect(events).toEqual([]);
    });

    it('getEventsBetween returns [] when nothing matches the range (Req 6.3)', async () => {
      await service.createEvent(samplePayload);
      const events = await service.getEventsBetween(
        '2030-01-01T00:00:00.000Z',
        '2030-12-31T00:00:00.000Z'
      );
      expect(events).toEqual([]);
    });

    it('getEventsBetween returns [] when start is later than end (Req 6.4)', async () => {
      await service.createEvent(samplePayload);
      const events = await service.getEventsBetween(
        '2025-12-31T00:00:00.000Z',
        '2025-01-01T00:00:00.000Z'
      );
      expect(events).toEqual([]);
    });

    it('getEvent returns null for a non-matching id (Req 7.2)', async () => {
      const result = await service.getEvent('does-not-exist');
      expect(result).toBeNull();
    });

    it('getEvent returns null for null/undefined/empty ids (Req 7.3)', async () => {
      expect(await service.getEvent(null)).toBeNull();
      expect(await service.getEvent(undefined)).toBeNull();
      expect(await service.getEvent('')).toBeNull();
    });

    it('deleteEvent returns falsy for a non-matching id (Req 8.2)', async () => {
      const result = await service.deleteEvent('does-not-exist');
      expect(result).toBeFalsy();
    });

    it('deleteEvent returns falsy for null/undefined/empty ids without side effect (Req 8.4)', async () => {
      const created = await service.createEvent(samplePayload);

      expect(await service.deleteEvent(null)).toBeFalsy();
      expect(await service.deleteEvent(undefined)).toBeFalsy();
      expect(await service.deleteEvent('')).toBeFalsy();

      // The existing record is untouched.
      expect(await CalendarEvent.countDocuments()).toBe(1);
      expect(await service.getEvent(created.id)).not.toBeNull();
    });

    it('createEvent returns a populated id, delete is truthy then falsy (Req 13.5)', async () => {
      const created = await service.createEvent(samplePayload);
      expect(created.id).toBeTruthy();
      expect(typeof created.id).toBe('string');

      const firstDelete = await service.deleteEvent(created.id);
      expect(firstDelete).toBeTruthy();

      const secondDelete = await service.deleteEvent(created.id);
      expect(secondDelete).toBeFalsy();
    });

    it('listEvents returns events ordered by startsAt ascending (Req 13.6)', async () => {
      await service.createEvent({
        ...samplePayload,
        startsAt: '2025-09-01T00:00:00.000Z'
      });
      await service.createEvent({
        ...samplePayload,
        startsAt: '2025-03-01T00:00:00.000Z'
      });
      await service.createEvent({
        ...samplePayload,
        startsAt: '2025-06-01T00:00:00.000Z'
      });

      const events = await service.listEvents();
      const times = events.map((e) => Date.parse(e.startsAt));
      const sorted = [...times].sort((a, b) => a - b);
      expect(times).toEqual(sorted);
    });

    it('getEventsBetween returns events ordered by startsAt ascending (Req 13.6)', async () => {
      await service.createEvent({
        ...samplePayload,
        startsAt: '2025-09-01T00:00:00.000Z'
      });
      await service.createEvent({
        ...samplePayload,
        startsAt: '2025-03-01T00:00:00.000Z'
      });
      await service.createEvent({
        ...samplePayload,
        startsAt: '2025-06-01T00:00:00.000Z'
      });

      const events = await service.getEventsBetween(
        '2025-01-01T00:00:00.000Z',
        '2025-12-31T00:00:00.000Z'
      );
      const times = events.map((e) => Date.parse(e.startsAt));
      const sorted = [...times].sort((a, b) => a - b);
      expect(times).toEqual(sorted);
    });

    it('getEvent returns null for an unknown identifier (Req 13.7)', async () => {
      await service.createEvent(samplePayload);
      const result = await service.getEvent('unknown-identifier');
      expect(result).toBeNull();
    });
  });
});

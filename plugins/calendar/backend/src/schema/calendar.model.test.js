import { describe, it, expect } from 'vitest';
import { CalendarEvent } from './calendar.model.js';

/**
 * Task 2.2 - Model smoke / config tests.
 * These tests inspect schema configuration and run synchronous validation only,
 * so they do not require a database connection.
 */
describe('CalendarEvent model configuration', () => {
  it('uses the dedicated collection name "calendarevents" (Req 1.3)', () => {
    expect(CalendarEvent.collection.collectionName).toBe('calendarevents');
  });

  it('declares an ascending index on startsAt in schema.indexes() (Req 2.8)', () => {
    const indexes = CalendarEvent.schema.indexes();
    const startsAtIndex = indexes.find(
      ([fields]) => fields && fields.startsAt === 1
    );

    expect(startsAtIndex).toBeDefined();
    expect(startsAtIndex[0].startsAt).toBe(1);
  });

  it('rejects a non-enum eventType via validateSync (Req 2.4)', () => {
    const doc = new CalendarEvent({
      title: 'Valid Title',
      eventType: 'not-a-real-type',
      startsAt: new Date(),
      createdBy: 'user-1'
    });

    const error = doc.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.eventType).toBeDefined();
  });

  it('accepts each allowed enum value for eventType (Req 2.4)', () => {
    for (const eventType of ['task-deadline', 'event', 'milestone']) {
      const doc = new CalendarEvent({
        title: 'Valid Title',
        eventType,
        startsAt: new Date(),
        createdBy: 'user-1'
      });

      const error = doc.validateSync();
      expect(error).toBeUndefined();
    }
  });

  it('rejects missing required fields via validateSync (Req 2.5)', () => {
    const doc = new CalendarEvent({});

    const error = doc.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.eventType).toBeDefined();
    expect(error.errors.startsAt).toBeDefined();
    expect(error.errors.createdBy).toBeDefined();
  });

  it('defaults optional fields to null when omitted (Req 2.6)', () => {
    const doc = new CalendarEvent({
      title: 'Valid Title',
      eventType: 'event',
      startsAt: new Date(),
      createdBy: 'user-1'
    });

    expect(doc.endsAt).toBeNull();
    expect(doc.description).toBeNull();
    expect(doc.linkedTaskId).toBeNull();
    expect(doc.linkedEventId).toBeNull();
  });
});

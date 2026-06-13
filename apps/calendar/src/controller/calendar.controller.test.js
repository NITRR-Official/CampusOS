import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi
} from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '../../../../backend/src/database/connection.js';
import { errorMiddleware } from '../../../../backend/src/middleware/error.js';
import { requireRoles } from '../../../../backend/src/middleware/permissions.js';
import { CalendarEvent } from '../schema/calendar.model.js';
import { getCalendarService } from '../service/calendar.service.js';
import { createCalendarController } from './calendar.controller.js';
import { registerCalendarRoutes } from '../routes/calendar.routes.js';
import {
  validateCreateCalendarEventPayload,
  validateQueryCalendarEventsPayload
} from '../schema/calendar.schema.js';

const LONG_TIMEOUT = 120000;

function makeRes() {
  return {
    statusCode: undefined,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

const validBody = {
  title: 'Team Sync',
  eventType: 'event',
  startsAt: '2025-06-01T09:00:00.000Z'
};

describe('Calendar controller and middleware wiring', () => {
  let mongoServer;
  let service;

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Task 6.2 - Async / error wiring (Req 3.3, 3.4, 12.1, 12.2, 12.3, 12.4, 12.5)
  // ---------------------------------------------------------------------------

  describe('async/error wiring', () => {
    it('service createEvent rejects when the model throws (Req 12.1)', async () => {
      vi.spyOn(CalendarEvent, 'create').mockRejectedValue(new Error('db down'));
      await expect(
        service.createEvent({ ...validBody, createdBy: 'user-1' })
      ).rejects.toThrow('db down');
    });

    it('service listEvents rejects when the model throws (Req 12.1)', async () => {
      vi.spyOn(CalendarEvent, 'find').mockImplementation(() => {
        throw new Error('db down');
      });
      await expect(service.listEvents()).rejects.toThrow('db down');
    });

    it('controller forwards a service rejection via next(err) (Req 3.4)', async () => {
      const dbError = new Error('db down');
      vi.spyOn(service, 'listEvents').mockRejectedValue(dbError);
      const controller = createCalendarController();

      const next = vi.fn();
      await controller.list({}, makeRes(), next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBe(dbError);
    });

    it('a forwarded DB error yields a 500 response, distinct from a 400 validation error (Req 12.2, 12.3)', async () => {
      const dbError = new Error('db down');
      vi.spyOn(service, 'createEvent').mockRejectedValue(dbError);
      const controller = createCalendarController();

      // DB failure path -> next(err) -> error middleware -> 500
      const dbReq = { body: validBody, user: { id: 'user-1', role: 'admin' } };
      const dbRes = makeRes();
      await controller.create(dbReq, dbRes, (err) => {
        errorMiddleware(err, dbReq, dbRes, () => {});
      });
      expect(dbRes.statusCode).toBe(500);

      // Validation failure path -> next(400 VALIDATION_ERROR) -> error middleware -> 400
      const badReq = {
        body: { title: 'x' },
        user: { id: 'user-1', role: 'admin' }
      };
      const badRes = makeRes();
      await controller.create(badReq, badRes, (err) => {
        errorMiddleware(err, badReq, badRes, () => {});
      });
      expect(badRes.statusCode).toBe(400);

      expect(dbRes.statusCode).not.toBe(badRes.statusCode);
    });

    it('a failed createEvent persists nothing (Req 12.4)', async () => {
      // An invalid eventType makes Mongoose validation reject the create; the
      // single-document write is atomic, so nothing should be persisted.
      await expect(
        service.createEvent({
          title: 'Bad Event',
          eventType: 'not-a-type',
          startsAt: '2025-06-01T09:00:00.000Z',
          createdBy: 'user-1'
        })
      ).rejects.toThrow();

      expect(await CalendarEvent.countDocuments()).toBe(0);
    });

    it('a failed deleteEvent leaves the record intact (Req 12.5)', async () => {
      const created = await service.createEvent({
        ...validBody,
        createdBy: 'user-1'
      });

      vi.spyOn(CalendarEvent, 'deleteOne').mockRejectedValue(
        new Error('db down')
      );
      await expect(service.deleteEvent(created.id)).rejects.toThrow('db down');

      vi.restoreAllMocks();
      const still = await CalendarEvent.findById(created.id);
      expect(still).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Task 7.1 - Validation regression (Req 10.1 - 10.8)
  // ---------------------------------------------------------------------------

  describe('validation regression', () => {
    function fields(result) {
      return result.errors.map((e) => e.field);
    }

    it('rejects a title shorter than 3 or longer than 140 chars (Req 10.1)', () => {
      expect(
        fields(
          validateCreateCalendarEventPayload({ ...validBody, title: 'ab' })
        )
      ).toContain('title');
      expect(
        fields(
          validateCreateCalendarEventPayload({
            ...validBody,
            title: 'a'.repeat(141)
          })
        )
      ).toContain('title');
    });

    it('rejects a non-enum eventType (Req 10.2)', () => {
      const result = validateCreateCalendarEventPayload({
        ...validBody,
        eventType: 'party'
      });
      expect(fields(result)).toContain('eventType');
    });

    it('rejects an absent or invalid startsAt (Req 10.3)', () => {
      expect(
        fields(
          validateCreateCalendarEventPayload({
            title: 'Valid Title',
            eventType: 'event'
          })
        )
      ).toContain('startsAt');
      expect(
        fields(
          validateCreateCalendarEventPayload({
            ...validBody,
            startsAt: 'not-a-date'
          })
        )
      ).toContain('startsAt');
    });

    it('rejects a present but invalid endsAt (Req 10.4)', () => {
      const result = validateCreateCalendarEventPayload({
        ...validBody,
        endsAt: 'not-a-date'
      });
      expect(fields(result)).toContain('endsAt');
    });

    it('rejects an endsAt earlier than startsAt (Req 10.5)', () => {
      const result = validateCreateCalendarEventPayload({
        ...validBody,
        startsAt: '2025-06-01T10:00:00.000Z',
        endsAt: '2025-06-01T09:00:00.000Z'
      });
      expect(fields(result)).toContain('endsAt');
    });

    it('rejects an over-length description (Req 10.6)', () => {
      const result = validateCreateCalendarEventPayload({
        ...validBody,
        description: 'd'.repeat(1001)
      });
      expect(fields(result)).toContain('description');
    });

    it('rejects invalid range params identifying the offending field (Req 10.7)', () => {
      expect(fields(validateQueryCalendarEventsPayload({}))).toEqual(
        expect.arrayContaining(['startDate', 'endDate'])
      );
      expect(
        fields(
          validateQueryCalendarEventsPayload({
            startDate: 'nope',
            endDate: '2025-06-01T00:00:00.000Z'
          })
        )
      ).toContain('startDate');
      expect(
        fields(
          validateQueryCalendarEventsPayload({
            startDate: '2025-06-02T00:00:00.000Z',
            endDate: '2025-06-01T00:00:00.000Z'
          })
        )
      ).toContain('endDate');
    });

    it('controller returns 400 + VALIDATION_ERROR identifying failed fields (Req 10.8)', async () => {
      const controller = createCalendarController();
      const req = {
        body: { title: 'x', eventType: 'bogus' },
        user: { id: 'u', role: 'admin' }
      };
      const res = makeRes();
      let forwarded;

      await controller.create(req, res, (err) => {
        forwarded = err;
        errorMiddleware(err, req, res, () => {});
      });

      expect(forwarded.status).toBe(400);
      expect(forwarded.code).toBe('VALIDATION_ERROR');
      const erroredFields = forwarded.details.map((d) => d.field);
      expect(erroredFields).toEqual(
        expect.arrayContaining(['title', 'eventType', 'startsAt'])
      );
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Task 7.2 - Route authorization (Req 11.1 - 11.7)
  // ---------------------------------------------------------------------------

  describe('route authorization', () => {
    function makeFakeApp() {
      const routes = { get: {}, post: {}, delete: {} };
      return {
        routes,
        get(path, ...handlers) {
          routes.get[path] = handlers;
        },
        post(path, ...handlers) {
          routes.post[path] = handlers;
        },
        delete(path, ...handlers) {
          routes.delete[path] = handlers;
        }
      };
    }

    function buildRoutes() {
      const controller = createCalendarController();
      const app = makeFakeApp();
      registerCalendarRoutes(app, controller, requireRoles);
      return { app, controller };
    }

    it('routes GET endpoints to the matching service operations (Req 11.1, 11.2, 11.3)', () => {
      const { app, controller } = buildRoutes();

      expect(app.routes.get['/api/v1/calendar']).toEqual([controller.list]);
      expect(app.routes.get['/api/v1/calendar/range']).toEqual([
        controller.queryByRange
      ]);
      expect(app.routes.get['/api/v1/calendar/:eventId']).toEqual([
        controller.getById
      ]);
    });

    it('GET list handler invokes listEvents (Req 11.1)', async () => {
      const controller = createCalendarController();
      const listSpy = vi.spyOn(service, 'listEvents').mockResolvedValue([]);

      await controller.list({}, makeRes(), () => {});
      expect(listSpy).toHaveBeenCalledTimes(1);
    });

    it('guards POST/DELETE with admin and coordinator roles (Req 11.4, 11.5)', () => {
      const { app } = buildRoutes();
      const postGuard = app.routes.post['/api/v1/calendar'][0];
      const deleteGuard = app.routes.delete['/api/v1/calendar/:eventId'][0];

      for (const guard of [postGuard, deleteGuard]) {
        for (const role of ['admin', 'coordinator']) {
          const next = vi.fn();
          const res = makeRes();
          guard({ user: { role } }, res, next);
          expect(next).toHaveBeenCalledTimes(1);
          expect(res.statusCode).toBeUndefined();
        }
      }
    });

    it('rejects POST create for a non-privileged role with no side effect (Req 11.6)', async () => {
      const { app } = buildRoutes();
      const handlers = app.routes.post['/api/v1/calendar'];
      const createSpy = vi
        .spyOn(service, 'createEvent')
        .mockResolvedValue({ id: 'x' });

      const req = { user: { role: 'volunteer' }, body: validBody };
      const res = makeRes();

      let advanced = false;
      handlers[0](req, res, () => {
        advanced = true;
      });
      if (advanced) {
        await handlers[1](req, res, () => {});
      }

      expect(advanced).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('rejects DELETE for a non-privileged role with no side effect (Req 11.7)', async () => {
      const { app } = buildRoutes();
      const handlers = app.routes.delete['/api/v1/calendar/:eventId'];
      const deleteSpy = vi
        .spyOn(service, 'deleteEvent')
        .mockResolvedValue(true);

      const req = { user: { role: 'volunteer' }, params: { eventId: 'abc' } };
      const res = makeRes();

      let advanced = false;
      handlers[0](req, res, () => {
        advanced = true;
      });
      if (advanced) {
        await handlers[1](req, res, () => {});
      }

      expect(advanced).toBe(false);
      expect(res.statusCode).toBe(403);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('allows an authorized role to reach the create operation (Req 11.4)', async () => {
      const { app } = buildRoutes();
      const handlers = app.routes.post['/api/v1/calendar'];
      const createSpy = vi
        .spyOn(service, 'createEvent')
        .mockResolvedValue({ id: 'x' });

      const req = { user: { id: 'admin-1', role: 'admin' }, body: validBody };
      const res = makeRes();

      let advanced = false;
      handlers[0](req, res, () => {
        advanced = true;
      });
      if (advanced) {
        await handlers[1](req, res, () => {});
      }

      expect(advanced).toBe(true);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    it('responds 401 when the user context is missing', () => {
      const guard = requireRoles('admin', 'coordinator');
      const next = vi.fn();
      const res = makeRes();

      guard({}, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

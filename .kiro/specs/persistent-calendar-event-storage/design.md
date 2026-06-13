# Design Document

## Overview

This feature (GitHub issue #22) migrates the calendar module's persistence layer from a
process-local in-memory `Map` to MongoDB via Mongoose. The change is intentionally
narrow: it swaps the **system of record** and converts the `CalendarService` methods from
synchronous to asynchronous, while preserving every externally observable behavior of the
HTTP API — the response shape, the validation rules, the ordering guarantees, the route
authorization, and the status codes.

The migration follows the convention already established by the sibling `vendor` module
(and `resource`, `scheduling`, `budget`):

- A **Mongoose model** declared in the module's `schema/` directory.
- A **service** whose methods are `async` and delegate to the Mongoose model.
- An **explicit document-to-response serializer** in the service that maps `_id → id` and
  normalizes types, so the controller can serialize the result unchanged.
- A **test suite** backed by `mongodb-memory-server`, using the shared connection helpers
  in `backend/src/database/connection.js`.

### Goals

- Persist calendar events durably across process restarts and share them across instances.
- Preserve the exact API response shape: `id` (never `_id`), ISO 8601 date strings, and an
  exact field set.
- Keep request validation (`calendar.schema.js`) and route authorization
  (`calendar.routes.js`) untouched.
- Surface MongoDB failures as 5xx errors, distinct from the 400 used for validation.

### Non-Goals

- Changing validation rules, route paths, or authorization roles.
- Adding new endpoints, fields, or query capabilities.
- Changing the JSON envelope (`{ success, data }`) produced by the controller.

### Key Design Decisions

| Decision                    | Choice                                                                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mongoose model file name    | `apps/calendar/src/schema/calendar.model.js`                                                 | The conventional name `calendar.schema.js` is **already taken** by the request-validation module. The vendor module uses `*.schema.js` for its Mongoose model because it has no separate validation file; calendar cannot, so the model gets a distinct `calendar.model.js`. This keeps validation and persistence concerns in clearly separated files and avoids a name collision. |
| Service file                | Rewrite existing `apps/calendar/src/service/calendar.service.js` in place                    | The controller already depends on `getCalendarService()` from this path. Rewriting in place (rather than adding a `.mongodb.js` variant) keeps the singleton accessor stable and avoids dangling dead code.                                                                                                                                                                         |
| Document → response mapping | **Explicit serializer function** in the service (not a schema `toJSON`/`toObject` transform) | Matches the vendor convention (`normalizeVendor`), produces a single pure, unit-testable mapping, and reliably converts `Date` objects to ISO 8601 strings — something a `.lean()` read plus a passive transform does not guarantee. The serializer also enforces the exact field set.                                                                                              |
| Service return shape        | Plain serialized event objects (and `boolean` for delete)                                    | Preserves the pre-migration contract the controller and clients already expect. Unlike `vendor.service.js`, calendar does **not** wrap results in `{ success, ... }`; the existing controller reads the value directly, so the rewrite keeps that contract.                                                                                                                         |
| Date storage                | Store `startsAt`/`endsAt` as Mongoose `Date`                                                 | Enables correct range queries and ascending sort at the database level (Requirement 6, 5.2). The serializer converts back to ISO strings on read.                                                                                                                                                                                                                                   |

## Architecture

The layering is unchanged; only the service's internals and its sync/async nature change.

```mermaid
flowchart TD
    Client[HTTP Client] -->|request| Routes[calendar.routes.js<br/>requireRoles auth]
    Routes --> Controller[calendar.controller.js<br/>async handlers]
    Controller -->|validate| Validation[calendar.schema.js<br/>UNCHANGED]
    Controller -->|await| Service[calendar.service.js<br/>async, MongoDB-backed]
    Service --> Serializer[serializeEvent<br/>_id→id, Date→ISO]
    Service --> Model[calendar.model.js<br/>Mongoose model]
    Model --> Mongo[(MongoDB<br/>calendarevents)]
    Controller -->|next error| ErrorMw[backend error.js<br/>status || 500]
    Connection[backend/database/connection.js] -.-> Mongo
```

### Request flows

**Create (`POST /api/v1/calendar`)** — `requireRoles('admin','coordinator')` → controller
validates body → on validation failure `next(400 VALIDATION_ERROR)` → otherwise
`await service.createEvent(...)` → on resolve, `201 { success, data }` → on reject,
`next(error)` → error middleware responds 500.

**List (`GET /api/v1/calendar`)** — controller `await service.listEvents()` →
`200 { success, data }` ordered by `startsAt` asc, `_id` asc.

**Range (`GET /api/v1/calendar/range`)** — controller validates query → `await
service.getEventsBetween(startDate, endDate)` → `200 { success, data }`.

**Get by id (`GET /api/v1/calendar/:eventId`)** — `await service.getEvent(eventId)` →
`null` ⇒ `next(404 CALENDAR_EVENT_NOT_FOUND)`; otherwise `200 { success, data }`.

**Delete (`DELETE /api/v1/calendar/:eventId`)** — `requireRoles('admin','coordinator')`
→ `await service.deleteEvent(eventId)` → falsy ⇒ `next(404)`; truthy ⇒
`200 { success, data: { deleted: true, eventId } }`.

### Error handling boundary

Validation failures already produce an `Error` with `status = 400` and
`code = 'VALIDATION_ERROR'`. A MongoDB failure produces a plain `Error` (no `status`),
which the central middleware (`backend/src/middleware/error.js`, `status = err.status ||
err.statusCode || 500`) maps to **500** — distinct from 400 (Requirement 12.2, 12.3).

## Components and Interfaces

### 1. Mongoose model — `apps/calendar/src/schema/calendar.model.js` (new)

Follows `vendor.schema.js` structure: String `_id` defaulting to a stringified ObjectId,
`timestamps: true`, an explicit `collection` name, and indexes.

```js
import mongoose from 'mongoose';

const EVENT_TYPES = ['task-deadline', 'event', 'milestone'];

const calendarEventSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    title: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, enum: EVENT_TYPES },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    description: { type: String, default: null },
    linkedTaskId: { type: String, default: null },
    linkedEventId: { type: String, default: null },
    createdBy: { type: String, required: true }
  },
  {
    timestamps: true,
    collection: 'calendarevents'
  }
);

// Ascending index supports ascending-ordered listing and range queries.
calendarEventSchema.index({ startsAt: 1 });

export const CalendarEvent = mongoose.model(
  'CalendarEvent',
  calendarEventSchema
);
export default CalendarEvent;
```

Notes:

- `enum: EVENT_TYPES` enforces Requirement 2.4 at the persistence layer as defense in depth;
  the controller-level `calendar.schema.js` already rejects bad values with a 400 first.
- The collection name `calendarevents` (Requirement 1.3) is set explicitly rather than
  relying on Mongoose pluralization, to make the contract unambiguous.

### 2. Serializer — `serializeEvent(doc)` (private helper in the service)

A pure function mapping a Mongoose document or `.lean()` object to the API response shape.

Responsibilities:

- Map `_id → id`; never expose `_id`.
- Emit **exactly** these keys: `id`, `title`, `eventType`, `startsAt`, `endsAt`,
  `description`, `linkedTaskId`, `linkedEventId`, `createdBy`, `createdAt`, `updatedAt`.
- Convert `Date` values to ISO 8601 strings via `toISOString()`; pass through `null`
  for nullable date fields (`endsAt`).
- Preserve `null` for nullable string fields (`description`, `linkedTaskId`, `linkedEventId`).

```js
function toIso(value) {
  if (value == null) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function serializeEvent(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: obj._id,
    title: obj.title,
    eventType: obj.eventType,
    startsAt: toIso(obj.startsAt),
    endsAt: toIso(obj.endsAt),
    description: obj.description ?? null,
    linkedTaskId: obj.linkedTaskId ?? null,
    linkedEventId: obj.linkedEventId ?? null,
    createdBy: obj.createdBy,
    createdAt: toIso(obj.createdAt),
    updatedAt: toIso(obj.updatedAt)
  };
}
```

### 3. Service — `apps/calendar/src/service/calendar.service.js` (rewritten)

Same public surface and singleton accessor as today; methods become `async`. The `Map` is
removed entirely (Requirement 1.4).

```js
import { CalendarEvent } from '../schema/calendar.model.js';

class CalendarService {
  async createEvent(payload) {
    const doc = await CalendarEvent.create({
      title: payload.title,
      eventType: payload.eventType,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt ?? null,
      description: payload.description ?? null,
      linkedTaskId: payload.linkedTaskId ?? null,
      linkedEventId: payload.linkedEventId ?? null,
      createdBy: payload.createdBy
    });
    return serializeEvent(doc);
  }

  async listEvents() {
    const docs = await CalendarEvent.find()
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return docs.map(serializeEvent);
  }

  async getEventsBetween(startDate, endDate) {
    const docs = await CalendarEvent.find({
      startsAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return docs.map(serializeEvent);
  }

  async getEvent(eventId) {
    if (!eventId) return null; // null/undefined/empty → null (Req 7.3)
    const doc = await CalendarEvent.findById(eventId).lean();
    return serializeEvent(doc); // no match → serializeEvent(null) → null
  }

  async deleteEvent(eventId) {
    if (!eventId) return false; // absent/null/empty → falsy (Req 8.4)
    const result = await CalendarEvent.deleteOne({ _id: eventId });
    return result.deletedCount > 0;
  }
}

const calendarService = new CalendarService();
export function getCalendarService() {
  return calendarService;
}
export default getCalendarService;
```

Behavioral notes:

- `createEvent` lets DB/validation errors reject (no try/catch swallowing) so the controller
  can propagate them (Requirement 12.1, 12.4). A failed `create` persists nothing.
- `getEvent` returns `null` for both missing ids and no-match (Requirement 7.2, 7.3) without
  signaling an error. `findById` with a non-matching String `_id` resolves to `null`.
- `deleteEvent` uses `deleteOne` and returns a boolean (Requirement 8.1, 8.2, 8.4). A DB
  failure rejects, leaving the record intact (Requirement 12.5).
- Tie-break ordering uses `_id` ascending, which equals `id` ascending since `id` is `_id`
  (Requirement 5.2, 6.2).

### 4. Controller — `apps/calendar/src/controller/calendar.controller.js` (modified)

Each handler becomes `async`, awaits the service, and wraps the service call in `try/catch`
to forward DB rejections via `next(error)`. Validation and 404 logic are unchanged.

```js
async function create(req, res, next) {
  const { errors, value } = validateCreateCalendarEventPayload(req.body);
  if (errors.length > 0) {
    next(
      createHttpError(
        400,
        'Request validation failed',
        'VALIDATION_ERROR',
        errors
      )
    );
    return;
  }
  try {
    const event = await calendarService.createEvent({
      ...value,
      createdBy: req.user?.id || 'unknown'
    });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err); // → error middleware → 500
  }
}

async function list(req, res, next) {
  try {
    res
      .status(200)
      .json({ success: true, data: await calendarService.listEvents() });
  } catch (err) {
    next(err);
  }
}

async function queryByRange(req, res, next) {
  const { errors, value } = validateQueryCalendarEventsPayload(req.query);
  if (errors.length > 0) {
    next(
      createHttpError(
        400,
        'Request validation failed',
        'VALIDATION_ERROR',
        errors
      )
    );
    return;
  }
  try {
    const events = await calendarService.getEventsBetween(
      value.startDate,
      value.endDate
    );
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const event = await calendarService.getEvent(req.params.eventId);
    if (!event) {
      next(
        createHttpError(
          404,
          'Calendar event not found',
          'CALENDAR_EVENT_NOT_FOUND'
        )
      );
      return;
    }
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  const { eventId } = req.params;
  try {
    const removed = await calendarService.deleteEvent(eventId);
    if (!removed) {
      next(
        createHttpError(
          404,
          'Calendar event not found',
          'CALENDAR_EVENT_NOT_FOUND'
        )
      );
      return;
    }
    res.status(200).json({ success: true, data: { deleted: true, eventId } });
  } catch (err) {
    next(err);
  }
}
```

### 5. Validation, routes, module wiring — unchanged

- `calendar.schema.js` (validation) is **not modified** (Requirement 10).
- `calendar.routes.js` registration and `requireRoles('admin','coordinator')` for
  `POST`/`DELETE` are **not modified** (Requirement 11).
- `index.js` continues to call `getCalendarService()` indirectly via the controller; no
  change required.

### 6. Test tooling — `apps/calendar/package.json`, `vitest.config.js` (new)

Calendar currently lacks an app-level `package.json`/test config. Mirror the vendor module:

```json
// apps/calendar/package.json
{
  "name": "@campus-os/calendar",
  "version": "0.0.1",
  "type": "module",
  "main": "src/index.js",
  "scripts": { "test": "vitest run --passWithNoTests" },
  "devDependencies": { "vitest": "^1.0.0" }
}
```

`vitest.config.js` mirrors vendor's (node environment, globals, v8 coverage excluding
`index.js`, `routes/`, `controller/`). `mongodb-memory-server` must be available as a dev
dependency (already used by the vendor suite).

## Data Models

### Calendar_Event (persisted document)

| Field           | Mongo type    | Required         | Default              | API (serialized) type                          |
| --------------- | ------------- | ---------------- | -------------------- | ---------------------------------------------- |
| `_id`           | String        | yes (auto)       | stringified ObjectId | exposed as `id` (String)                       |
| `title`         | String        | yes              | —                    | String                                         |
| `eventType`     | String (enum) | yes              | —                    | String (`task-deadline`\|`event`\|`milestone`) |
| `startsAt`      | Date          | yes              | —                    | ISO 8601 string                                |
| `endsAt`        | Date          | no               | `null`               | ISO 8601 string or `null`                      |
| `description`   | String        | no               | `null`               | String or `null`                               |
| `linkedTaskId`  | String        | no               | `null`               | String or `null`                               |
| `linkedEventId` | String        | no               | `null`               | String or `null`                               |
| `createdBy`     | String        | yes              | —                    | String                                         |
| `createdAt`     | Date          | yes (timestamps) | now                  | ISO 8601 string                                |
| `updatedAt`     | Date          | yes (timestamps) | now                  | ISO 8601 string                                |

#### Workflow-extensibility fields (foundational — not yet exposed by the API)

To support future workflow features (issue #41) without breaking the current API,
the persisted document also carries the following **optional, sensibly-defaulted**
fields. They are written/persisted but intentionally **excluded** from
`serializeEvent`, so the API response shape remains the exact 11-field set above.

| Field           | Mongo type       | Required | Default     | Group              | Purpose                                                       |
| --------------- | ---------------- | -------- | ----------- | ------------------ | ------------------------------------------------------------- |
| `status`        | String (enum)    | no       | `scheduled` | lifecycle          | Workflow state: `scheduled`\|`in-progress`\|`completed`\|`cancelled` (indexed) |
| `recurrence`    | Mixed/Object     | no       | `null`      | recurrence         | Placeholder for future RRULE-style recurring scheduling       |
| `category`      | String           | no       | `null`      | recurrence         | Optional categorization label                                 |
| `assignedTeams` | [String]         | no       | `[]`        | workflow ownership | Teams responsible for the event                               |
| `assignees`     | [String]         | no       | `[]`        | workflow ownership | Individual assignees                                          |
| `coordinators`  | [String]         | no       | `[]`        | workflow ownership | Coordinating users                                            |
| `linkedTaskIds` | [String]         | no       | `[]`        | linkage            | Forward-looking multi-link (singular `linkedTaskId` retained) |

**Note:** These workflow ownership arrays, lifecycle status, recurrence, and the
multi-link `linkedTaskIds` are **foundational** groundwork for upcoming workflow
features. They default such that existing create calls keep working, and they are
**not yet exposed** through the current HTTP API — the serialized response shape
is unchanged (still exactly the 11 fields below). This documents the schema's data
relationships (core, linkage, lifecycle, workflow ownership, recurrence) per the
issue's acceptance criterion.

### API response shape (per event)

```json
{
  "id": "65f0c0a1b2c3d4e5f6a7b8c9",
  "title": "Project deadline",
  "eventType": "task-deadline",
  "startsAt": "2025-06-01T09:00:00.000Z",
  "endsAt": null,
  "description": null,
  "linkedTaskId": null,
  "linkedEventId": null,
  "createdBy": "user-123",
  "createdAt": "2025-05-20T12:34:56.000Z",
  "updatedAt": "2025-05-20T12:34:56.000Z"
}
```

Wrapped by the controller as `{ "success": true, "data": <event | event[] > }`.

### Date normalization note

ISO date strings supplied by validated input are cast to `Date` on write and rendered back
to ISO strings (UTC, millisecond precision) on read via `toISOString()`. The value returned
by `createEvent` is itself the serialized form, so a later `getEvent` returns byte-identical
ISO strings (Requirement 1.2). Inputs with differing zone offsets but the same instant
normalize to the same UTC string — an intended consequence of storing instants as `Date`.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid
executions of a system — essentially, a formal statement about what the system should do.
Properties serve as the bridge between human-readable specifications and machine-verifiable
correctness guarantees._

The properties below are derived from the prework analysis. Redundant criteria were
consolidated: the persistence round-trip subsumes single-event retrieval (7.1) and
cross-instance sharing (1.5); the two ordering criteria (5.2, 6.2) are unified into one
ordering property over both query methods; and all response-shape criteria (9.1–9.7) are
unified into one serializer property applied elementwise. Pure validation (Req 10),
authorization (Req 11), async/controller wiring (Req 3, 12), and test-suite/config criteria
(Req 13) are covered by example, integration, edge-case, and smoke tests in the Testing
Strategy rather than as properties.

### Property 1: Persistence round-trip preserves all fields

_For any_ valid calendar event payload, creating the event and then retrieving it by its
returned `id` (via a fresh read from the store) yields an event whose `id`, `title`,
`eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`,
`createdBy`, `createdAt`, and `updatedAt` are all equal to those of the created event.

**Validates: Requirements 1.1, 1.2, 1.5, 7.1**

### Property 2: Create persists exactly one event and preserves supplied fields

_For any_ valid payload, `createEvent` increases the stored event count by exactly one,
returns an event with a non-empty `id`, and sets `title`, `eventType`, `startsAt`, and
`createdBy` to the values supplied in the payload.

**Validates: Requirements 4.1, 4.3, 4.8, 2.2**

### Property 3: Created event identifiers are unique

_For any_ sequence of valid payloads created in succession, every returned `id` is a
non-empty string and all returned `id` values are distinct from one another.

**Validates: Requirements 4.2**

### Property 4: Omitted optional fields default to null

_For any_ valid payload that omits any subset of `endsAt`, `description`, `linkedTaskId`,
and `linkedEventId`, the created and re-read event has the JSON value `null` for each
omitted field.

**Validates: Requirements 2.6, 4.4, 4.5, 4.6, 4.7**

### Property 5: Creation timestamps are present and equal

_For any_ created event, `createdAt` and `updatedAt` are both present and equal to each
other at creation time.

**Validates: Requirements 2.7, 4.9**

### Property 6: List returns every stored event exactly once

_For any_ set of created events, `listEvents` returns a collection whose set of `id` values
equals exactly the set of stored event `id` values, with each appearing exactly once.

**Validates: Requirements 5.1**

### Property 7: Query results are ordered by startsAt then id

_For any_ set of created events, both `listEvents` and `getEventsBetween` return events in
non-decreasing order of `startsAt`, and events sharing the same `startsAt` are ordered by
`id` ascending.

**Validates: Requirements 5.2, 6.2**

### Property 8: Range query returns exactly the events within inclusive bounds

_For any_ set of created events and any start/end pair, `getEventsBetween(start, end)`
returns exactly those events whose `startsAt` instant is greater than or equal to `start`
and less than or equal to `end`; when `start` is later than `end` the result is empty.

**Validates: Requirements 6.1, 6.3, 6.4**

### Property 9: Delete removes the targeted event

_For any_ stored event, `deleteEvent(id)` returns a truthy result, and a subsequent
`getEvent(id)` returns `null`.

**Validates: Requirements 8.1, 8.3**

### Property 10: Serialization yields the exact response shape

_For any_ calendar event, the serialized output contains exactly the keys `id`, `title`,
`eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`,
`createdBy`, `createdAt`, and `updatedAt` (no `_id` and no extra keys); every non-null date
field is an ISO 8601 string that re-parses to the same instant; and every null nullable
field is JSON `null`. This holds for each element when a collection is serialized.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

## Error Handling

| Scenario                                    | Service behavior                                                   | Controller behavior                                         | HTTP result                              |
| ------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------- |
| Invalid create/range payload                | not reached                                                        | `next(createHttpError(400, …, 'VALIDATION_ERROR', errors))` | 400 with field details (Req 10.8)        |
| `getEvent`/`deleteEvent` on missing id      | resolves `null` / `false`                                          | `next(createHttpError(404, …, 'CALENDAR_EVENT_NOT_FOUND'))` | 404                                      |
| `getEvent`/`deleteEvent` with null/empty id | returns `null` / `false`, no query                                 | 404 (get) or 404 (delete) — no error thrown                 | 404 (Req 7.3, 8.4)                       |
| MongoDB failure during any method           | Promise **rejects** with the DB error                              | `catch (err) { next(err) }`                                 | 500 via error middleware (Req 12.1–12.3) |
| MongoDB failure during `createEvent`        | rejects; `create` is atomic per-document, nothing partial persists | `next(err)`                                                 | 500; no record left (Req 12.4)           |
| MongoDB failure during `deleteEvent`        | rejects; target document remains                                   | `next(err)`                                                 | 500; record intact (Req 12.5)            |

Key points:

- DB errors are **never** swallowed in the service (no `try/catch` that returns a success
  value), so rejections propagate to the controller and then to
  `backend/src/middleware/error.js`, which maps a status-less error to **500** — distinct
  from the **400** used for validation (Req 12.2, 12.3).
- Atomicity: a single-document `create` either fully persists or not at all; there is no
  partial write to clean up (Req 12.4). `deleteOne` only removes on success, so a failed
  delete leaves the record in place (Req 12.5).
- Guarded inputs (null/undefined/empty id) short-circuit to `null`/`false` without touching
  the database, so they cannot raise spurious errors (Req 7.3, 8.4).

## Testing Strategy

The calendar module is well-suited to **property-based testing** for its persistence,
ordering, filtering, and serialization logic — these are pure or deterministic behaviors
with large input spaces and clear universal invariants. Property-based tests are
complemented by example, edge-case, integration, and smoke tests for behaviors that do not
vary meaningfully with input (validation, authorization, async wiring, configuration).

### Tooling

- **Test runner:** `vitest` (matching the vendor module's `vitest run` script).
- **Database:** `mongodb-memory-server`, connected via
  `backend/src/database/connection.js` (`connectDB`/`disconnectDB`), following
  `apps/vendor/src/service/vendor.service.test.js` (Req 13.1, 13.2).
- **Property library:** `fast-check` (the standard PBT library for the JS/Vitest
  ecosystem). Do **not** hand-roll random generation.
- **Lifecycle:** `beforeAll` starts the in-memory server and connects; `afterAll`
  disconnects and stops it (Req 13.3); `beforeEach` runs
  `CalendarEvent.deleteMany({})` so each case starts with an empty `calendarevents`
  collection (Req 13.4).
- **New files:** `apps/calendar/package.json` and `apps/calendar/vitest.config.js`
  mirroring the vendor module; add `mongodb-memory-server` and `fast-check` as dev
  dependencies.

### Property-based tests

- One property-based test per correctness property (Properties 1–10), each running a
  **minimum of 100 iterations**.
- Generators produce valid calendar payloads: `title` (3–140 chars), `eventType` from the
  enum, `startsAt`/`endsAt` as ISO date-time strings (with `endsAt >= startsAt` or omitted),
  and arbitrary/omitted optional strings, including non-ASCII and boundary-length values.
- For ordering/filter/list properties, generators emit **sets** of events (including
  duplicate `startsAt` values to exercise the `id` tie-break).
- Property 10 (serialization) runs against arbitrary persisted documents and against
  `listEvents`/`getEventsBetween` outputs to confirm element-wise application.
- Each property test is tagged with a comment referencing its design property, e.g.:
  `// Feature: persistent-calendar-event-storage, Property 7: Query results are ordered by startsAt then id`

### Example, edge-case, and integration tests

- **Validation (Req 10):** regression examples confirming the unchanged
  `calendar.schema.js` still rejects bad `title`/`eventType`/dates/`description` and returns
  400 + `VALIDATION_ERROR`.
- **Authorization (Req 11):** integration examples per route verifying `admin`/`coordinator`
  may create/delete and other roles are rejected (middleware unchanged).
- **Async/error wiring (Req 3, 12):** mock the model to throw and assert the service method
  **rejects**, the controller forwards via `next(err)`, and the response is **500** (distinct
  from 400); assert a failed `create` persists nothing and a failed `delete` leaves the
  record intact.
- **Edge cases:** empty store → `listEvents` returns `[]` (5.3); range matching nothing and
  `start > end` → `[]` (6.3, 6.4); `getEvent`/`deleteEvent` with non-matching and
  null/undefined/empty ids → `null`/`false` (7.2, 7.3, 8.2, 8.4); non-enum `eventType` and
  missing required fields rejected at the model layer (2.4, 2.5).
- **Smoke/config:** model collection name is `calendarevents` (1.3); the five service
  methods exist (3.1); ascending index on `startsAt` is declared (2.8).

### Required behavior coverage (Req 13.5–13.7)

The suite explicitly verifies create, list, range-query, get-by-id, and delete; that
`createEvent` returns a populated `id`; that `deleteEvent` returns truthy for an existing id
and falsy for a non-existent id; that `listEvents` and `getEventsBetween` return events
ordered by `startsAt` ascending; and that `getEvent` returns `null` for an unknown id.

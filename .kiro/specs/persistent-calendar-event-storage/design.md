# Design Document

## Overview

This feature (GitHub issue #22) migrates the calendar module's persistence layer from a
process-local in-memory `Map` to MongoDB. The change converts the `CalendarService`
methods from synchronous to asynchronous while preserving every externally observable
behavior of the HTTP API — the response shape, the validation rules, the ordering
guarantees, the route authorization, and the status codes.

Rather than wiring the service directly to a Mongoose model, the persistence was
restructured into a **layered repository/adapter architecture** so the storage engine
sits behind a storage-agnostic abstraction. This was delivered through a set of focused
sub-issues under parent issue #22:

- **#41** — the Mongoose model (`schema/calendar.model.js`) with the core fields plus
  foundational workflow-extensibility fields and indexes.
- **#43** — the abstract `CalendarEventRepository` base class defining the
  storage-agnostic persistence contract (no Mongoose import).
- **#44** — the concrete `MongoCalendarEventRepository` adapter that binds the contract to
  the Mongoose model and owns the document → response normalization (`serializeEvent`).
- **#45** — the refactored `CalendarService`, which takes an injectable repository via its
  constructor and delegates every method to it (no direct DB access).
- **#46** — the test suite (model, service property/edge, controller wiring, repository
  adapter integration, and DB-free delegation tests).

The result keeps the HTTP layering intact while introducing a clean seam between workflow
logic and storage:

- A **Mongoose model** declared in the module's `schema/` directory.
- A **repository abstraction** that workflow/service code depends on instead of a database
  driver — the storage engine is swappable and the service is mockable.
- A **MongoDB adapter** implementing that abstraction, which owns the explicit
  document-to-response serializer mapping `_id → id` and normalizing types.
- A **service** whose methods are `async` and delegate to the injected repository.
- A **test suite** backed by `mongodb-memory-server`, using the shared connection helpers
  in `backend/src/database/connection.js`, plus DB-free delegation tests.

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

| Decision                    | Choice                                                                                                                                        | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mongoose model file name    | `apps/calendar/src/schema/calendar.model.js`                                                                                                  | The conventional name `calendar.schema.js` is **already taken** by the request-validation module. The vendor module uses `*.schema.js` for its Mongoose model because it has no separate validation file; calendar cannot, so the model gets a distinct `calendar.model.js`. This keeps validation and persistence concerns in clearly separated files and avoids a name collision.                                                                                                                  |
| Persistence abstraction     | **Repository pattern** — an abstract `CalendarEventRepository` base class with a concrete `MongoCalendarEventRepository` adapter (#43, #44)   | The service depends on a storage-agnostic contract instead of a database driver. This decouples workflow logic from MongoDB (database portability — swapping engines means writing a new subclass), enables dependency injection so the service can be tested with a fake/mock repository without a real database (testability), and documents the contract in one authoritative place. The base class throws "not implemented" for each method so a subclass that forgets to override fails loudly. |
| Service file                | Rewrite `apps/calendar/src/service/calendar.service.js` in place as a thin delegator over an injectable repository (#45)                      | The controller already depends on `getCalendarService()` from this path. Rewriting in place keeps the singleton accessor stable. The `CalendarService` class is now exported and takes a repository via its constructor (defaulting to `MongoCalendarEventRepository`); each method delegates to the repository and holds no direct DB access or normalization logic.                                                                                                                                |
| Document → response mapping | **Explicit serializer function** living in the **MongoDB adapter** (`MongoCalendarEventRepository`), not in the service or a schema transform | The serializer (`serializeEvent`/`toIso`) is a persistence concern, so it belongs with the concrete adapter that produces the normalized domain object. It produces a single pure, unit-testable mapping, reliably converts `Date` objects to ISO 8601 strings — something a `.lean()` read plus a passive transform does not guarantee — and enforces the exact 11-key field set. The repository abstraction and service deal only in already-normalized domain objects (`id` + ISO strings).       |
| Service return shape        | Plain serialized event objects (and `boolean` for delete)                                                                                     | Preserves the pre-migration contract the controller and clients already expect. Unlike `vendor.service.js`, calendar does **not** wrap results in `{ success, ... }`; the existing controller reads the value directly, so the rewrite keeps that contract.                                                                                                                                                                                                                                          |
| Date storage                | Store `startsAt`/`endsAt` as Mongoose `Date`                                                                                                  | Enables correct range queries and ascending sort at the database level (Requirement 6, 5.2). The serializer converts back to ISO strings on read.                                                                                                                                                                                                                                                                                                                                                    |

## Architecture

The HTTP layering (routes → controller → service) is preserved. The service no longer
talks to Mongoose directly; instead it delegates to a repository abstraction, and a
MongoDB adapter binds that abstraction to the model. The repository seam is the
injectable/mockable boundary: in production the service is constructed with a
`MongoCalendarEventRepository`, while tests can inject a fake repository.

```mermaid
flowchart TD
    Client[HTTP Client] -->|request| Routes[calendar.routes.js<br/>requireRoles auth]
    Routes --> Controller[calendar.controller.js<br/>async handlers, UNCHANGED]
    Controller -->|validate| Validation[calendar.schema.js<br/>UNCHANGED]
    Controller -->|await| Service[calendar.service.js<br/>CalendarService, async]
    Service -->|delegates to| Repo[CalendarEventRepository<br/>abstract contract, storage-agnostic]

    subgraph Injectable["injectable / mockable boundary"]
        Repo -.->|production default| Adapter[MongoCalendarEventRepository<br/>adapter + serializeEvent _id→id, Date→ISO]
        Repo -.->|tests inject| Fake[Fake/mock repository<br/>DB-free delegation tests]
    end

    Adapter --> Model[calendar.model.js<br/>Mongoose model]
    Model --> Mongo[(MongoDB<br/>calendarevents)]
    Controller -->|next error| ErrorMw[backend error.js<br/>status || 500]
    Connection[backend/database/connection.js] -.-> Mongo
```

The service is constructed via `new CalendarService(repository)` (default
`new MongoCalendarEventRepository()`); `getCalendarService()` remains a lazy singleton
accessor. The repository contract is `createEvent`, `getEventById`, `listEvents`,
`queryEventsByRange`, `updateEvent`, and `deleteEvent`; the service maps its public method
names onto these (see Components and Interfaces).

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

The persistence concern is split across four layers — model, repository abstraction,
MongoDB adapter, and service — plus the unchanged controller and validation/routes.

### Sub-issue mapping

| Layer                                              | File                                              | Sub-issue |
| -------------------------------------------------- | ------------------------------------------------- | --------- |
| Mongoose model (+ workflow-extensibility fields)   | `schema/calendar.model.js`                        | **#41**   |
| Repository abstraction (storage-agnostic contract) | `repository/calendar-event.repository.js`         | **#43**   |
| MongoDB adapter (+ serializer)                     | `repository/mongo-calendar-event.repository.js`   | **#44**   |
| Refactored service (DI + delegation)               | `service/calendar.service.js`                     | **#45**   |
| Test suite (5 files, 82 tests)                     | `*.test.js` across schema/service/controller/repo | **#46**   |

All sit under parent issue **#22**.

### 1. Mongoose model — `apps/calendar/src/schema/calendar.model.js` (#41)

Defines a String `_id` defaulting to a stringified ObjectId, `timestamps: true`, an
explicit `collection` name, and indexes. Beyond the core API fields it carries
foundational **workflow-extensibility** fields (`status`, `recurrence`, `category`,
`assignedTeams`, `assignees`, `coordinators`, `linkedTaskIds`) that are persisted but
intentionally **not** exposed by the current API serializer, so the API response stays the
exact 11-field set. There are indexes on `startsAt` (ascending listing/range queries) and
`status` (future lifecycle filtering).

```js
import mongoose from 'mongoose';

const EVENT_TYPES = ['task-deadline', 'event', 'milestone'];
const STATUS_VALUES = ['scheduled', 'in-progress', 'completed', 'cancelled'];

const calendarEventSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },

    // --- CORE (exposed by current API) ---
    title: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, enum: EVENT_TYPES },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    description: { type: String, default: null },

    // --- LINKAGE ---
    linkedTaskId: { type: String, default: null }, // singular, exposed by API
    linkedEventId: { type: String, default: null }, // singular, exposed by API
    linkedTaskIds: { type: [String], default: [] }, // multi-link, foundational

    // --- CORE (exposed by current API) ---
    createdBy: { type: String, required: true },

    // --- LIFECYCLE (foundational, not yet exposed) ---
    status: { type: String, enum: STATUS_VALUES, default: 'scheduled' },

    // --- WORKFLOW OWNERSHIP (foundational, not yet exposed) ---
    assignedTeams: { type: [String], default: [] },
    assignees: { type: [String], default: [] },
    coordinators: { type: [String], default: [] },

    // --- RECURRENCE / CATEGORIZATION (foundational, not yet exposed) ---
    recurrence: { type: mongoose.Schema.Types.Mixed, default: null },
    category: { type: String, default: null }
  },
  {
    timestamps: true,
    collection: 'calendarevents'
  }
);

// Ascending index supports ascending-ordered listing and date-range queries.
calendarEventSchema.index({ startsAt: 1 });
// Lifecycle index supports filtering/aggregating events by workflow status.
calendarEventSchema.index({ status: 1 });

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
- The workflow-extensibility fields are optional and sensibly defaulted so existing create
  calls keep working; they are excluded from the adapter's serializer.

### 2. Repository abstraction — `apps/calendar/src/repository/calendar-event.repository.js` (#43)

A storage-agnostic contract modelled as an abstract base class (plain JS has no native
interfaces). It does **not** import mongoose or the model. Every method throws a clear
"not implemented" error so a subclass that forgets to override one fails loudly, and the
contract is documented in one authoritative place. Services depend on this type so the
storage engine stays swappable and the service stays mockable.

The contract (all returning normalized domain objects with `id` and ISO 8601 date strings,
never raw documents):

- `createEvent(payload)` → `Promise<CalendarEvent>`
- `getEventById(id)` → `Promise<CalendarEvent | null>`
- `listEvents()` → `Promise<CalendarEvent[]>` (ordered by `startsAt` asc, then `id`)
- `queryEventsByRange(startDate, endDate)` → `Promise<CalendarEvent[]>` (inclusive bounds)
- `updateEvent(id, changes)` → `Promise<CalendarEvent | null>` (partial update; forward-looking)
- `deleteEvent(id)` → `Promise<boolean>`

```js
/**
 * Abstract base class declaring the calendar event persistence contract.
 * Storage-agnostic: no mongoose / model imports. Concrete adapters extend
 * this and override every method.
 * @abstract
 */
export class CalendarEventRepository {
  async createEvent(payload) {
    throw new Error(
      'CalendarEventRepository.createEvent must be implemented by a subclass'
    );
  }

  async getEventById(id) {
    throw new Error(
      'CalendarEventRepository.getEventById must be implemented by a subclass'
    );
  }

  async listEvents() {
    throw new Error(
      'CalendarEventRepository.listEvents must be implemented by a subclass'
    );
  }

  async queryEventsByRange(startDate, endDate) {
    throw new Error(
      'CalendarEventRepository.queryEventsByRange must be implemented by a subclass'
    );
  }

  async updateEvent(id, changes) {
    throw new Error(
      'CalendarEventRepository.updateEvent must be implemented by a subclass'
    );
  }

  async deleteEvent(id) {
    throw new Error(
      'CalendarEventRepository.deleteEvent must be implemented by a subclass'
    );
  }
}

export default CalendarEventRepository;
```

`updateEvent` is part of the contract to support future event editing (forward-looking for
issue #23) even though the current service does not yet expose an update operation.

### 3. MongoDB adapter — `apps/calendar/src/repository/mongo-calendar-event.repository.js` (#44)

`MongoCalendarEventRepository extends CalendarEventRepository` — the single place the
storage-agnostic contract is bound to the Mongoose model. It **owns** the `toIso`/
`serializeEvent` normalization: every method that resolves with an event resolves with the
normalized 11-key domain object (`_id → id`, `Date → ISO 8601`, nulls preserved), never a
raw Mongoose document. Database errors are **not** swallowed; they propagate (reject) to be
handled upstream.

```js
import { CalendarEvent } from '../schema/calendar.model.js';
import { CalendarEventRepository } from './calendar-event.repository.js';

function toIso(value) {
  if (value == null) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

// Maps _id -> id, emits exactly the 11 documented keys, converts Date fields to
// ISO 8601 strings, and preserves null for nullable fields.
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

export class MongoCalendarEventRepository extends CalendarEventRepository {
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

  async getEventById(id) {
    if (!id) return null;
    return serializeEvent(await CalendarEvent.findById(id).lean());
  }

  async listEvents() {
    const docs = await CalendarEvent.find()
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return docs.map(serializeEvent);
  }

  async queryEventsByRange(startDate, endDate) {
    const docs = await CalendarEvent.find({
      startsAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return docs.map(serializeEvent);
  }

  async updateEvent(id, changes) {
    if (!id) return null;
    const result = await CalendarEvent.findByIdAndUpdate(
      id,
      { $set: changes },
      { new: true, runValidators: true }
    ).lean();
    return serializeEvent(result);
  }

  async deleteEvent(id) {
    if (!id) return false;
    const result = await CalendarEvent.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export default MongoCalendarEventRepository;
```

Behavioral notes:

- `serializeEvent` excludes the workflow-extensibility fields, enforcing the exact 11-key
  API response shape (Property 10).
- Guarded inputs (null/undefined/empty id) short-circuit to `null`/`false` in
  `getEventById`/`updateEvent`/`deleteEvent` without touching the database (Req 7.3, 8.4).
- DB errors are never caught here, so rejections propagate through the service to the
  controller (Req 12.1–12.5). A failed `create` persists nothing; a failed `delete`/`update`
  leaves the record intact.
- Tie-break ordering uses `_id` ascending, which equals `id` ascending since `id` is `_id`
  (Requirement 5.2, 6.2).

### 4. Service — `apps/calendar/src/service/calendar.service.js` (#45, refactored)

`CalendarService` is now **exported** and takes an injectable repository via its
constructor (defaulting to `new MongoCalendarEventRepository()`). It owns no persistence or
normalization logic; every public method delegates to the injected repository. Repository
rejections are intentionally **not** caught here — they propagate to the controller.
`getCalendarService()` remains a lazy singleton accessor and the public method surface is
unchanged, so the controller is unaffected.

Method delegation (public service method → repository contract method):

- `createEvent` → `repository.createEvent`
- `listEvents` → `repository.listEvents`
- `getEventsBetween` → `repository.queryEventsByRange`
- `getEvent` → `repository.getEventById`
- `deleteEvent` → `repository.deleteEvent`

```js
import { MongoCalendarEventRepository } from '../repository/mongo-calendar-event.repository.js';

export class CalendarService {
  /**
   * @param {import('../repository/calendar-event.repository.js').CalendarEventRepository} [repository]
   *   Persistence adapter to delegate to. Defaults to a new MongoCalendarEventRepository.
   */
  constructor(repository = new MongoCalendarEventRepository()) {
    this.repository = repository;
  }

  async createEvent(payload) {
    return this.repository.createEvent(payload);
  }

  async listEvents() {
    return this.repository.listEvents();
  }

  async getEventsBetween(startDate, endDate) {
    return this.repository.queryEventsByRange(startDate, endDate);
  }

  async getEvent(eventId) {
    return this.repository.getEventById(eventId);
  }

  async deleteEvent(eventId) {
    return this.repository.deleteEvent(eventId);
  }
}

let calendarService = null;

export function getCalendarService() {
  if (!calendarService) {
    calendarService = new CalendarService();
  }
  return calendarService;
}

export default getCalendarService;
```

Behavioral notes:

- Because the repository normalizes results, `getEvent` returns `null` for both missing ids
  and no-match (Req 7.2, 7.3), and `deleteEvent` returns a boolean (Req 8.1, 8.2, 8.4).
- DB/validation errors reject through the delegation (no swallowing), so the controller can
  propagate them (Req 12.1, 12.4).
- The constructor seam lets tests inject a fake/mock repository for DB-free delegation tests
  (issue #46).

### 5. Controller — `apps/calendar/src/controller/calendar.controller.js` (unchanged)

The controller is unchanged by the repository refactor. Each handler is `async`, awaits the
service, and wraps the service call in `try/catch` to forward DB rejections via
`next(error)`. Validation and 404 logic are unchanged. Because the service keeps the same
public method surface and singleton accessor, no controller change was needed.

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

### 6. Validation, routes, module wiring — unchanged

- `calendar.schema.js` (validation) is **not modified** (Requirement 10).
- `calendar.routes.js` registration and `requireRoles('admin','coordinator')` for
  `POST`/`DELETE` are **not modified** (Requirement 11).
- `index.js` continues to call `getCalendarService()` indirectly via the controller; no
  change required.

### 7. Test tooling — `apps/calendar/package.json`, `vitest.config.js` (new)

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

| Field           | Mongo type    | Required | Default     | Group              | Purpose                                                                        |
| --------------- | ------------- | -------- | ----------- | ------------------ | ------------------------------------------------------------------------------ |
| `status`        | String (enum) | no       | `scheduled` | lifecycle          | Workflow state: `scheduled`\|`in-progress`\|`completed`\|`cancelled` (indexed) |
| `recurrence`    | Mixed/Object  | no       | `null`      | recurrence         | Placeholder for future RRULE-style recurring scheduling                        |
| `category`      | String        | no       | `null`      | recurrence         | Optional categorization label                                                  |
| `assignedTeams` | [String]      | no       | `[]`        | workflow ownership | Teams responsible for the event                                                |
| `assignees`     | [String]      | no       | `[]`        | workflow ownership | Individual assignees                                                           |
| `coordinators`  | [String]      | no       | `[]`        | workflow ownership | Coordinating users                                                             |
| `linkedTaskIds` | [String]      | no       | `[]`        | linkage            | Forward-looking multi-link (singular `linkedTaskId` retained)                  |

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

The layered architecture is covered by **5 test files totaling 82 tests** (#46), spread
across the layers so each seam is verified independently:

| Test file                                            | Layer / focus                                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `schema/calendar.model.test.js`                      | Model schema: required fields, enums, defaults (incl. workflow-extensibility fields), collection name                    |
| `service/calendar.service.test.js`                   | Service behavior end-to-end via the real MongoDB adapter — property tests + edge cases (`mongodb-memory-server`)         |
| `controller/calendar.controller.test.js`             | Controller wiring: validation, authorization, 404, and error-forwarding (`next(err)`)                                    |
| `repository/mongo-calendar-event.repository.test.js` | MongoDB adapter integration incl. `updateEvent` and 2 adapter-level properties (`mongodb-memory-server`)                 |
| `service/calendar.service.repository.test.js`        | **DB-free** delegation/decoupling: a fake/mock repository proves the service delegates each method and holds no DB logic |

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
- **Async/error wiring (Req 3, 12):** make the repository (or model) reject and assert the
  service method **rejects**, the controller forwards via `next(err)`, and the response is
  **500** (distinct from 400); assert a failed `create` persists nothing and a failed
  `delete` leaves the record intact.
- **Repository adapter integration (#44):** `mongo-calendar-event.repository.test.js`
  exercises the adapter directly against `mongodb-memory-server` — create/get/list/range/
  delete plus `updateEvent`, the `serializeEvent` 11-key shape, and 2 adapter-level
  properties.
- **DB-free service delegation (#45/#46):** `calendar.service.repository.test.js` injects a
  fake repository (no database) to verify each `CalendarService` method delegates to the
  matching repository method (`createEvent`→`createEvent`, `getEvent`→`getEventById`,
  `getEventsBetween`→`queryEventsByRange`, etc.) and that the service adds no persistence or
  normalization logic of its own — proving the storage decoupling.
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

# Implementation Plan: Add Persistent Calendar Event Storage

## Overview

This plan migrates the calendar module from in-memory `Map` storage to MongoDB via Mongoose,
following the convention established by the sibling `vendor` module. Work proceeds bottom-up:
first the Mongoose model and the test tooling (so tests can run as soon as code exists), then
the serializer and async service, then the async controller, and finally property-based,
example, edge-case, integration, and smoke tests that validate the 13 requirements and the
10 correctness properties. Each step builds on the previous one and ends with the service
and controller fully wired into the existing routes and module entry point.

Implementation language: **JavaScript (ES modules)**, matching the existing calendar and
vendor modules. Tests use `vitest` + `mongodb-memory-server` + `fast-check`.

## Tasks

- [ ] 1. Set up calendar test tooling and dependencies
  - [ ] 1.1 Create the calendar app package and vitest config
    - Create `apps/calendar/package.json` mirroring `apps/vendor/package.json` (name `@campus-os/calendar`, `"type": "module"`, `main` `src/index.js`, `test` script `vitest run --passWithNoTests`)
    - Create `apps/calendar/vitest.config.js` mirroring `apps/vendor/vitest.config.js` (node environment, globals enabled, v8 coverage excluding `index.js`, `routes/`, `controller/`)
    - Add `vitest`, `mongodb-memory-server`, and `fast-check` as dev dependencies
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 2. Implement the Mongoose calendar event model
  - [ ] 2.1 Create `apps/calendar/src/schema/calendar.model.js`
    - Define `calendarEventSchema` following `apps/vendor/src/schema/vendor.schema.js`: String `_id` defaulting to `() => new mongoose.Types.ObjectId().toString()`
    - Define `title`, `eventType`, `description`, `linkedTaskId`, `linkedEventId`, `createdBy` as String fields and `startsAt`, `endsAt` as Date fields
    - Restrict `eventType` with `enum: ['task-deadline', 'event', 'milestone']`
    - Require `title`, `eventType`, `startsAt`, `createdBy`; default `endsAt`, `description`, `linkedTaskId`, `linkedEventId` to `null`
    - Enable `timestamps: true` and set `collection: 'calendarevents'`
    - Declare ascending index `calendarEventSchema.index({ startsAt: 1 })`
    - Export `CalendarEvent` (named and default)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 1.3_

  - [ ]\* 2.2 Write smoke/config tests for the model
    - Assert the model's collection name is `calendarevents` (Req 1.3)
    - Assert the `startsAt: 1` ascending index is declared in `schema.indexes()` (Req 2.8)
    - Assert a non-enum `eventType` and missing required fields are rejected at the model layer via `validateSync` (Req 2.4, 2.5)
    - _Requirements: 1.3, 2.4, 2.5, 2.8_

- [ ] 3. Implement the serializer and async MongoDB-backed service
  - [ ] 3.1 Implement the `serializeEvent` private helper in `apps/calendar/src/service/calendar.service.js`
    - Add `toIso(value)` returning `null` for nullish values and `toISOString()` otherwise
    - Implement `serializeEvent(doc)` mapping `_id → id`, emitting exactly the 11 keys `id`, `title`, `eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`, `createdBy`, `createdAt`, `updatedAt`, converting Date fields to ISO strings and preserving `null` for nullable fields
    - Return `null` when `doc` is nullish
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ] 3.2 Rewrite the `CalendarService` class as async and MongoDB-backed
    - Remove the in-memory `Map` entirely; import `CalendarEvent` from `../schema/calendar.model.js`
    - Implement `async createEvent(payload)` calling `CalendarEvent.create(...)` with optional fields coalesced to `null`, returning `serializeEvent(doc)`
    - Implement `async listEvents()` using `.find().sort({ startsAt: 1, _id: 1 }).lean()` mapped through `serializeEvent`
    - Implement `async getEventsBetween(startDate, endDate)` filtering `startsAt` with `$gte`/`$lte` as `Date`, sorted `{ startsAt: 1, _id: 1 }`, mapped through `serializeEvent`
    - Implement `async getEvent(eventId)` returning `null` for falsy ids, otherwise `serializeEvent(await CalendarEvent.findById(eventId).lean())`
    - Implement `async deleteEvent(eventId)` returning `false` for falsy ids, otherwise `(await CalendarEvent.deleteOne({ _id: eventId })).deletedCount > 0`
    - Do not swallow DB errors (no try/catch returning success); preserve the `getCalendarService()` singleton accessor and default export
    - _Requirements: 1.1, 1.2, 1.4, 3.1, 3.2, 4.1, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 12.1, 12.4, 12.5_

  - [ ]\* 3.3 Write property test for persistence round-trip
    - **Property 1: Persistence round-trip preserves all fields**
    - **Validates: Requirements 1.1, 1.2, 1.5, 7.1**
    - Use `fast-check` with a valid-payload generator, minimum 100 iterations; create then re-read by returned `id` and assert all 11 fields are equal

  - [ ]\* 3.4 Write property test for create fidelity and single-document persistence
    - **Property 2: Create persists exactly one event and preserves supplied fields**
    - **Validates: Requirements 4.1, 4.3, 4.8, 2.2**
    - `fast-check`, minimum 100 iterations; assert stored count increases by exactly one, `id` is non-empty, and `title`/`eventType`/`startsAt`/`createdBy` match the payload

  - [ ]\* 3.5 Write property test for identifier uniqueness
    - **Property 3: Created event identifiers are unique**
    - **Validates: Requirements 4.2**
    - `fast-check`, minimum 100 iterations; create a sequence and assert every `id` is a non-empty string and all are distinct

  - [ ]\* 3.6 Write property test for null defaults on omitted optional fields
    - **Property 4: Omitted optional fields default to null**
    - **Validates: Requirements 2.6, 4.4, 4.5, 4.6, 4.7**
    - `fast-check`, minimum 100 iterations; randomly omit subsets of `endsAt`/`description`/`linkedTaskId`/`linkedEventId` and assert each omitted field is `null` after create and re-read

  - [ ]\* 3.7 Write property test for creation timestamp equality
    - **Property 5: Creation timestamps are present and equal**
    - **Validates: Requirements 2.7, 4.9**
    - `fast-check`, minimum 100 iterations; assert `createdAt` and `updatedAt` are both present and equal at creation time

- [ ] 4. Checkpoint - Ensure model, serializer, and service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement query, ordering, range, delete, and serialization property tests
  - [ ]\* 5.1 Write property test for list completeness
    - **Property 6: List returns every stored event exactly once**
    - **Validates: Requirements 5.1**
    - `fast-check`, minimum 100 iterations; generate a set of events and assert the set of `listEvents` `id` values equals the stored set with each appearing once

  - [ ]\* 5.2 Write property test for ordering by startsAt then id
    - **Property 7: Query results are ordered by startsAt then id**
    - **Validates: Requirements 5.2, 6.2**
    - `fast-check`, minimum 100 iterations; generate sets including duplicate `startsAt` values and assert both `listEvents` and `getEventsBetween` are non-decreasing by `startsAt` with `id` ascending tie-break

  - [ ]\* 5.3 Write property test for inclusive range filtering
    - **Property 8: Range query returns exactly the events within inclusive bounds**
    - **Validates: Requirements 6.1, 6.3, 6.4**
    - `fast-check`, minimum 100 iterations; assert `getEventsBetween(start, end)` returns exactly events with `startsAt` in `[start, end]`, and an empty list when `start > end`

  - [ ]\* 5.4 Write property test for delete removal
    - **Property 9: Delete removes the targeted event**
    - **Validates: Requirements 8.1, 8.3**
    - `fast-check`, minimum 100 iterations; assert `deleteEvent(id)` is truthy and a subsequent `getEvent(id)` returns `null`

  - [ ]\* 5.5 Write property test for response-shape serialization
    - **Property 10: Serialization yields the exact response shape**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**
    - `fast-check`, minimum 100 iterations; assert serialized output has exactly the 11 keys (no `_id`, no extras), non-null date fields are ISO strings that re-parse to the same instant, and null nullable fields are JSON `null`; verify element-wise over `listEvents`/`getEventsBetween` outputs

- [ ] 6. Make the calendar controller async and wire error forwarding
  - [ ] 6.1 Convert `apps/calendar/src/controller/calendar.controller.js` handlers to async
    - Make `create`, `list`, `queryByRange`, `getById`, `deleteEvent` async; `await` the corresponding service calls before serializing responses
    - Wrap each service call in `try/catch` and forward DB rejections via `next(err)`; keep validation (`next(400 VALIDATION_ERROR)`) and 404 (`CALENDAR_EVENT_NOT_FOUND`) logic unchanged
    - Preserve response envelopes: `201 { success, data }` on create, `200 { success, data }` on list/range/get, `200 { success, data: { deleted: true, eventId } }` on delete
    - _Requirements: 3.3, 3.4, 12.1, 12.2, 12.3_

  - [ ]\* 6.2 Write integration tests for async/error wiring
    - Mock `CalendarEvent` to throw and assert the service method's Promise rejects, the controller forwards via `next(err)`, and the response status is 5xx/500 (distinct from 400)
    - Assert a failed `createEvent` leaves nothing persisted (Req 12.4) and a failed `deleteEvent` leaves the record intact (Req 12.5)
    - _Requirements: 3.3, 3.4, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 7. Add example, edge-case, validation, and authorization tests
  - [ ]\* 7.1 Write validation regression example tests
    - Confirm the unchanged `calendar.schema.js` rejects bad `title` (trimmed length <3 or >140), non-enum `eventType`, absent/invalid `startsAt`, invalid/earlier `endsAt`, over-length `description`, and invalid range params, returning 400 + `VALIDATION_ERROR` identifying the offending field
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]\* 7.2 Write authorization integration tests per route
    - Verify `admin`/`coordinator` may `POST`/`DELETE`, and other roles are rejected with an authorization error and no create/delete side effect; verify `GET` list/range/by-id route to the corresponding service operations
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ]\* 7.3 Write edge-case and required-behavior tests
    - Empty store → `listEvents` returns `[]` (5.3); range matching nothing and `start > end` → `[]` (6.3, 6.4); `getEvent`/`deleteEvent` with non-matching and null/undefined/empty ids → `null`/`false` (7.2, 7.3, 8.2, 8.4)
    - Assert the five service methods exist (3.1), `createEvent` returns a populated `id`, `deleteEvent` is truthy for an existing id and falsy for a non-existent id, and `listEvents`/`getEventsBetween` are ordered by `startsAt` ascending (13.5, 13.6, 13.7)
    - Use the `mongodb-memory-server` lifecycle (`beforeAll` connect, `afterAll` disconnect/stop, `beforeEach` `deleteMany({})`)
    - _Requirements: 3.1, 5.3, 6.3, 6.4, 7.2, 7.3, 8.2, 8.4, 13.5, 13.6, 13.7_

- [ ] 8. Final checkpoint - Run the full calendar test suite
  - Run `vitest run` for the calendar module and ensure all property, example, edge-case, integration, and smoke tests pass; fix any failures
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP, but they encode the 10 correctness properties and the Req 13 coverage and are strongly recommended.
- Each task references specific requirements (and properties where applicable) for traceability.
- All property-based tests use `fast-check` with a minimum of 100 iterations and a comment tagging the design property, e.g. `// Feature: persistent-calendar-event-storage, Property 7: Query results are ordered by startsAt then id`.
- Validation (`calendar.schema.js`), routes (`calendar.routes.js`), and module wiring (`index.js`) are intentionally not modified.
- Checkpoints provide incremental validation points after core implementation and at the end.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2"] },
    {
      "id": 3,
      "tasks": [
        "3.3",
        "3.4",
        "3.5",
        "3.6",
        "3.7",
        "5.1",
        "5.2",
        "5.3",
        "5.4",
        "5.5",
        "6.1"
      ]
    },
    { "id": 4, "tasks": ["6.2", "7.1", "7.2", "7.3"] }
  ]
}
```

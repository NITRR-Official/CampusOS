# Requirements Document

## Introduction

This feature (GitHub issue #22) replaces the calendar module's in-memory `Map` storage with persistent MongoDB storage using Mongoose. Currently `apps/calendar/src/service/calendar.service.js` stores calendar events in a process-local `Map` (`calendarEventsById`), so all events are lost on process restart and cannot be shared across instances.

The migration follows the established convention already applied to the sibling `vendor`, `resource`, `scheduling`, and `budget` modules: a Mongoose schema file, a MongoDB service variant whose methods are asynchronous, and a test suite backed by `mongodb-memory-server`. The migration MUST preserve all existing externally observable behavior of the calendar HTTP API and all existing request validation, changing only the persistence mechanism and the synchronous-to-asynchronous nature of the service methods.

## Glossary

- **Calendar_Service**: The service component exposed by `apps/calendar/src/service/calendar.service.js` that provides calendar event operations to the controller layer.
- **Calendar_Schema**: The Mongoose model definition for calendar events, to be created following the convention used by `apps/vendor/src/schema/vendor.schema.js`.
- **Calendar_Event**: A persisted record with the fields `id`, `title`, `eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`, `createdBy`, `createdAt`, and `updatedAt`.
- **Event_Type**: The category of a Calendar_Event, restricted to the values `task-deadline`, `event`, or `milestone`.
- **Calendar_Controller**: The HTTP controller in `apps/calendar/src/controller/calendar.controller.js` that invokes Calendar_Service methods and serializes responses.
- **Calendar_Validation**: The request validation defined in `apps/calendar/src/schema/calendar.schema.js`.
- **MongoDB_Store**: The MongoDB database accessed through Mongoose using the shared connection infrastructure at `backend/src/database/connection.js`.
- **Test_Suite**: The automated test file for the calendar service that uses `mongodb-memory-server` for an in-memory MongoDB instance.
- **API_Response_Shape**: The JSON structure returned by the calendar HTTP endpoints, including an `id` field (not `_id`) and ISO 8601 date-time string values for `startsAt`, `endsAt`, `createdAt`, and `updatedAt`.

## Requirements

### Requirement 1: Persistent MongoDB Storage

**User Story:** As a platform operator, I want calendar events stored in MongoDB, so that events persist across process restarts and are shared across application instances.

#### Acceptance Criteria

1. WHEN `createEvent` is invoked, THE Calendar_Service SHALL complete persistence of the Calendar_Event to the MongoDB_Store before the `createEvent` operation returns.
2. WHEN a Calendar_Event has been created and the process is subsequently restarted, THE Calendar_Service SHALL, upon a later `getEvent` invocation with that event's `id`, return a Calendar_Event whose `id`, `title`, `eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`, `createdBy`, `createdAt`, and `updatedAt` values are identical to those of the originally created Calendar_Event.
3. THE Calendar_Service SHALL store Calendar_Event records in a dedicated MongoDB collection named `calendarevents`.
4. THE Calendar_Service SHALL NOT use an in-memory `Map` as the system of record for Calendar_Event data.
5. WHEN a Calendar_Event has been created by one application instance, THE Calendar_Service SHALL include that Calendar_Event in the results of a `listEvents` invocation made from a distinct application instance connected to the same MongoDB_Store.

### Requirement 2: Mongoose Schema Following Established Convention

**User Story:** As a backend developer, I want the calendar Mongoose schema to follow the existing module conventions, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE Calendar_Schema SHALL define a Mongoose model in a schema file located at `apps/calendar/src/schema/` following the structure of `apps/vendor/src/schema/vendor.schema.js`.
2. THE Calendar_Schema SHALL define the `_id` field as a String that defaults to `new mongoose.Types.ObjectId().toString()`.
3. THE Calendar_Schema SHALL define `startsAt` and `endsAt` as date-time fields and `title`, `eventType`, `description`, `linkedTaskId`, `linkedEventId`, and `createdBy` as String fields.
4. THE Calendar_Schema SHALL restrict the `eventType` field to exactly the values `task-deadline`, `event`, and `milestone`, and SHALL reject any other value.
5. THE Calendar_Schema SHALL require the fields `title`, `eventType`, `startsAt`, and `createdBy`.
6. THE Calendar_Schema SHALL default the optional fields `endsAt`, `description`, `linkedTaskId`, and `linkedEventId` to `null` when they are not provided.
7. THE Calendar_Schema SHALL enable automatic `createdAt` and `updatedAt` timestamp management using the Mongoose `timestamps` option.
8. THE Calendar_Schema SHALL define an ascending index on the `startsAt` field to support ascending-ordered listing and date-range queries.

### Requirement 3: Asynchronous Service Interface

**User Story:** As a backend developer, I want the calendar service methods to be asynchronous, so that they can perform database operations consistent with the other migrated modules.

#### Acceptance Criteria

1. THE Calendar_Service SHALL expose exactly the five methods `createEvent`, `listEvents`, `getEventsBetween`, `getEvent`, and `deleteEvent`.
2. THE Calendar_Service SHALL implement each of the methods `createEvent`, `listEvents`, `getEventsBetween`, `getEvent`, and `deleteEvent` as a function whose return value is a Promise that subsequently settles either by resolving with the method's documented result or by rejecting with an error.
3. WHEN the Calendar_Controller invokes a Calendar_Service method and the returned Promise resolves, THE Calendar_Controller SHALL await that resolution and use the resolved value before serializing the HTTP response.
4. IF the Promise returned by a Calendar_Service method rejects, THEN THE Calendar_Controller SHALL NOT serialize a success HTTP response from the rejected value.

### Requirement 4: Create Event Behavior Preservation

**User Story:** As an admin or coordinator, I want to create calendar events, so that they are recorded and retrievable with the same fields as before the migration.

#### Acceptance Criteria

1. WHEN `createEvent` is invoked with a payload that satisfies Calendar_Validation, THE Calendar_Service SHALL persist exactly one Calendar_Event and return that created Calendar_Event.
2. WHEN a Calendar_Event is created, THE Calendar_Service SHALL assign a unique identifier exposed as the `id` field of the returned Calendar_Event.
3. WHEN a Calendar_Event is created, THE Calendar_Service SHALL set the `title`, `eventType`, and `startsAt` fields of the persisted Calendar_Event to the corresponding values supplied in the payload.
4. WHEN a Calendar_Event is created without an `endsAt` value, THE Calendar_Service SHALL set the `endsAt` field of the persisted Calendar_Event to `null`.
5. WHEN a Calendar_Event is created without a `description` value, THE Calendar_Service SHALL set the `description` field of the persisted Calendar_Event to `null`.
6. WHEN a Calendar_Event is created without a `linkedTaskId` value, THE Calendar_Service SHALL set the `linkedTaskId` field of the persisted Calendar_Event to `null`.
7. WHEN a Calendar_Event is created without a `linkedEventId` value, THE Calendar_Service SHALL set the `linkedEventId` field of the persisted Calendar_Event to `null`.
8. WHEN a Calendar_Event is created, THE Calendar_Service SHALL set the `createdBy` field of the persisted Calendar_Event to the `createdBy` value supplied in the payload.
9. WHEN a Calendar_Event is created, THE Calendar_Service SHALL set the `createdAt` and `updatedAt` fields to the record's creation date-time, and the two values SHALL be equal at creation time.

### Requirement 5: List Events Behavior Preservation

**User Story:** As a calendar user, I want to list all calendar events in chronological order, so that I can review the full schedule.

#### Acceptance Criteria

1. WHEN `listEvents` is invoked, THE Calendar_Service SHALL return a list containing every persisted Calendar_Event record exactly once.
2. WHEN `listEvents` returns two or more Calendar_Event records, THE Calendar_Service SHALL order the records by `startsAt` in ascending order, and SHALL order records that share the same `startsAt` value by `id` in ascending order.
3. IF no Calendar_Event records are persisted, THEN THE Calendar_Service SHALL return a list containing zero Calendar_Event records.

### Requirement 6: Range Query Behavior Preservation

**User Story:** As a calendar user, I want to query events that start within a date range, so that I can view events for a specific period.

#### Acceptance Criteria

1. WHEN `getEventsBetween` is invoked with a start date and an end date supplied as valid ISO 8601 date-time values, THE Calendar_Service SHALL return every Calendar_Event whose `startsAt` instant is greater than or equal to the start date and less than or equal to the end date, treating both bounds as inclusive.
2. WHEN `getEventsBetween` returns two or more Calendar_Event records, THE Calendar_Service SHALL order the records by `startsAt` in ascending order, and SHALL order records that share an identical `startsAt` value by their `id` in ascending order.
3. IF no Calendar_Event records have a `startsAt` value within the supplied range, THEN THE Calendar_Service SHALL return an empty list.
4. IF `getEventsBetween` is invoked with a start date that is later than the end date, THEN THE Calendar_Service SHALL return an empty list.

### Requirement 7: Get Single Event Behavior Preservation

**User Story:** As a calendar user, I want to retrieve a single event by its identifier, so that I can view its details.

#### Acceptance Criteria

1. WHEN `getEvent` is invoked with an identifier that exactly matches the `id` field of a persisted Calendar_Event, THE Calendar_Service SHALL return that single matching Calendar_Event including the fields `id`, `title`, `eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`, `createdBy`, `createdAt`, and `updatedAt`.
2. IF `getEvent` is invoked with a non-empty identifier that matches the `id` field of no persisted Calendar_Event, THEN THE Calendar_Service SHALL return `null` without signaling an error.
3. IF `getEvent` is invoked with an identifier that is null, undefined, or an empty string, THEN THE Calendar_Service SHALL return `null` without signaling an error.

### Requirement 8: Delete Event Behavior Preservation

**User Story:** As an admin or coordinator, I want to delete a calendar event, so that obsolete events are removed from the schedule.

#### Acceptance Criteria

1. WHEN `deleteEvent` is invoked with an identifier value that matches the `id` field of a persisted Calendar_Event, THE Calendar_Service SHALL remove the matching Calendar_Event from the MongoDB_Store and return a truthy result indicating deletion succeeded.
2. IF `deleteEvent` is invoked with an identifier that matches the `id` field of no persisted Calendar_Event, THEN THE Calendar_Service SHALL leave all persisted Calendar_Event records unchanged and return a falsy result indicating no deletion occurred.
3. WHEN `deleteEvent` removes a Calendar_Event, THE Calendar_Service SHALL cause a subsequent `getEvent` invocation with the same identifier to return `null`.
4. IF `deleteEvent` is invoked with an absent, null, or empty identifier, THEN THE Calendar_Service SHALL remove no Calendar_Event from the MongoDB_Store and return a falsy result indicating no deletion occurred.

### Requirement 9: API Response Shape Preservation

**User Story:** As an API consumer, I want the calendar endpoints to return the same JSON structure as before the migration, so that existing clients continue to work without changes.

#### Acceptance Criteria

1. WHEN the Calendar_Controller serializes a Calendar_Event, THE Calendar_Controller SHALL expose the persisted Calendar_Event identifier in a field named `id`.
2. WHEN the Calendar_Controller serializes a Calendar_Event, THE API_Response_Shape SHALL NOT contain a `_id` field.
3. WHEN the Calendar_Controller serializes a Calendar_Event, THE API_Response_Shape SHALL contain exactly the fields `id`, `title`, `eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`, `createdBy`, `createdAt`, and `updatedAt`, and SHALL NOT contain any field outside this set.
4. WHEN the Calendar_Controller serializes a Calendar_Event whose `endsAt`, `description`, `linkedTaskId`, or `linkedEventId` value is null, THE API_Response_Shape SHALL include that field with a JSON null value.
5. WHEN the Calendar_Controller serializes the `startsAt`, `endsAt`, `createdAt`, and `updatedAt` fields of a Calendar_Event, THE Calendar_Controller SHALL represent each non-null value as an ISO 8601 date-time string.
6. WHEN the Calendar_Controller serializes the `endsAt`, `createdAt`, or `updatedAt` field whose value is null, THE API_Response_Shape SHALL represent that field as a JSON null value.
7. WHEN the Calendar_Controller serializes a collection of Calendar_Event records, THE Calendar_Controller SHALL apply the field set defined in criterion 3 and the value representations defined in criteria 1, 2, 4, 5, and 6 to each Calendar_Event element in the collection.

### Requirement 10: Validation Preservation

**User Story:** As an API consumer, I want request validation to behave exactly as before, so that invalid requests are still rejected with the same errors.

#### Acceptance Criteria

1. IF a create request is submitted WHERE the `title` value, after leading and trailing whitespace is trimmed, has a length less than 3 characters or greater than 140 characters, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the `title` field.
2. IF a create request is submitted WHERE the `eventType` value is not one of `task-deadline`, `event`, or `milestone`, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the `eventType` field.
3. IF a create request is submitted WHERE the `startsAt` value is absent or is not a valid ISO 8601 date-time string, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the `startsAt` field.
4. IF a create request is submitted WHERE the `endsAt` value is present and is not a valid ISO 8601 date-time string, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the `endsAt` field.
5. IF a create request is submitted WHERE both `startsAt` and `endsAt` are valid ISO 8601 date-time strings and the `endsAt` value is strictly earlier than the `startsAt` value, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the `endsAt` field.
6. IF a create request is submitted WHERE the `description` value, after leading and trailing whitespace is trimmed, has a length greater than 1000 characters, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the `description` field.
7. IF a range request is submitted WHERE the `startDate` or `endDate` value is absent, is not a valid ISO 8601 date-time string, or the `endDate` value is strictly earlier than the `startDate` value, THEN THE Calendar_Validation SHALL reject the request and produce a validation error identifying the offending field.
8. WHEN a create or range request fails Calendar_Validation, THE Calendar_Controller SHALL respond with HTTP status 400 and a response body containing a `VALIDATION_ERROR` code that identifies each field that failed validation.

### Requirement 11: Route Authorization Preservation

**User Story:** As a security stakeholder, I want the calendar route authorization rules to remain unchanged, so that access control is not weakened by the migration.

#### Acceptance Criteria

1. WHEN a request is received at the route `GET /api/v1/calendar`, THE Calendar_Service SHALL invoke the list operation and return all persisted Calendar_Event records.
2. WHEN a request is received at the route `GET /api/v1/calendar/range`, THE Calendar_Service SHALL invoke the range-query operation and return the matching Calendar_Event records.
3. WHEN a request is received at the route `GET /api/v1/calendar/:eventId`, THE Calendar_Service SHALL invoke the single-event retrieval operation and return the matching Calendar_Event.
4. WHEN a request targets `POST /api/v1/calendar` and the requester holds the `admin` or `coordinator` role, THE Calendar_Service SHALL process the create operation.
5. WHEN a request targets `DELETE /api/v1/calendar/:eventId` and the requester holds the `admin` or `coordinator` role, THE Calendar_Service SHALL process the delete operation.
6. IF a request targets `POST /api/v1/calendar` and the requester does not hold the `admin` or `coordinator` role, THEN THE Calendar_Service SHALL reject the request without creating a Calendar_Event and return an authorization error indicating the requester lacks the required role.
7. IF a request targets `DELETE /api/v1/calendar/:eventId` and the requester does not hold the `admin` or `coordinator` role, THEN THE Calendar_Service SHALL reject the request without deleting any Calendar_Event and return an authorization error indicating the requester lacks the required role.

### Requirement 12: Database Error Handling

**User Story:** As an API consumer, I want database failures to be surfaced as errors rather than silent data loss, so that I can detect and respond to problems.

#### Acceptance Criteria

1. IF a MongoDB_Store operation fails during a Calendar_Service method, THEN THE Calendar_Service SHALL reject the Promise returned by that method with an error rather than resolving with a successful result.
2. WHEN the Calendar_Controller receives a rejected Promise from a Calendar_Service method, THE Calendar_Controller SHALL respond with an HTTP status in the 5xx range and a response body indicating failure.
3. WHEN the Calendar_Controller responds to a MongoDB_Store failure, THE Calendar_Controller SHALL use an HTTP status distinct from the 400 status used for validation failures.
4. IF a MongoDB_Store operation fails during a `createEvent` invocation, THEN THE Calendar_Service SHALL NOT leave a partial or successful Calendar_Event persisted in the MongoDB_Store.
5. IF a MongoDB_Store operation fails during a `deleteEvent` invocation, THEN THE Calendar_Service SHALL leave the targeted Calendar_Event persisted in the MongoDB_Store.

### Requirement 13: Test Coverage With In-Memory MongoDB

**User Story:** As a backend developer, I want the calendar service tested against an in-memory MongoDB instance, so that persistence behavior is verified without an external database.

#### Acceptance Criteria

1. THE Test_Suite SHALL use `mongodb-memory-server` to provide a MongoDB instance for calendar service tests, following the convention in `apps/vendor/src/service/vendor.service.test.js`.
2. WHEN the Test_Suite begins execution, THE Test_Suite SHALL connect to the in-memory MongoDB instance using the shared infrastructure at `backend/src/database/connection.js`.
3. WHEN the Test_Suite finishes execution, THE Test_Suite SHALL disconnect from and stop the in-memory MongoDB instance.
4. THE Test_Suite SHALL clear all Calendar_Event records between test cases so that each test case begins with an empty `calendarevents` collection.
5. THE Test_Suite SHALL verify the create, list, range-query, get-by-id, and delete behaviors of the Calendar_Service, including that `createEvent` returns a populated `id`, `deleteEvent` returns a truthy result for an existing identifier, and `deleteEvent` returns a falsy result for a non-existent identifier.
6. THE Test_Suite SHALL verify that `listEvents` and `getEventsBetween` return Calendar_Event records ordered by `startsAt` in ascending order.
7. THE Test_Suite SHALL verify that `getEvent` returns `null` for an identifier matching no persisted Calendar_Event.

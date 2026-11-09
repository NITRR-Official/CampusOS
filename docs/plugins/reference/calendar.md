# Calendar Plugin API Reference

The `calendar` plugin exposes time-management utilities and standardizes how dates and schedules are displayed and queried across the ecosystem.

## 1. Overview

- **Plugin ID**: `calendar`
- **Focus**: Date aggregation and visual timetables.
- **Exposed Routes**:
  - `PATCH /api/v1/calendar/:eventId`

### `PATCH /api/v1/calendar/:eventId`

Partially updates an existing calendar event. Requires the `calendar:manage` permission.

- **Body**: one or more of `title`, `eventType`, `startsAt`, `endsAt`, `description`, `linkedTaskId`, `linkedEventId`. Fields follow the same validation rules as event creation. An empty body or any other field (for example `createdBy`) is rejected.
- **Date range**: `endsAt` cannot be before `startsAt`. When only one of the two dates is supplied, it is checked against the stored value of the other. Setting `endsAt` to `null` clears the end date.
- **Responses**:
  - `200` with `{ success: true, data: <updated event> }`
  - `400` `Validation Error` for invalid fields or an invalid date range
  - `404` `CALENDAR_EVENT_NOT_FOUND` when no event matches `eventId`
- **Emits**: `calendar:updated` with `{ eventId, eventType }` after a successful update.

## 2. Permissions Exported (RBAC)

The `calendar` plugin registers the following atomic permissions:

| Permission ID     | Label            | Description                                          |
| ----------------- | ---------------- | ---------------------------------------------------- |
| `calendar:manage` | Manage Calendars | Allows modifying shared calendar views and schedules |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Integrates closely with `event` and `task`.

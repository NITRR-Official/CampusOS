# Calendar Plugin API Reference

The `calendar` plugin exposes time-management utilities and standardizes how dates and schedules are displayed and queried across the ecosystem.

## 1. Overview

- **Plugin ID**: `calendar`
- **Focus**: Date aggregation and visual timetables.

## 2. Permissions Exported (RBAC)

The `calendar` plugin registers the following atomic permissions:

| Permission ID     | Label            | Description                                          |
| ----------------- | ---------------- | ---------------------------------------------------- |
| `calendar:manage` | Manage Calendars | Allows modifying shared calendar views and schedules |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Integrates closely with `event` and `task`.

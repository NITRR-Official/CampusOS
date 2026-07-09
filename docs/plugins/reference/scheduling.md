# Scheduling Plugin API Reference

The `scheduling` plugin provides automated conflict resolution, timetabling, and reservation logic.

## 1. Overview

- **Plugin ID**: `scheduling`
- **Focus**: Timetabling and reservations.

## 2. Permissions Exported (RBAC)

The `scheduling` plugin registers the following atomic permissions:

| Permission ID       | Label            | Description                                                  |
| ------------------- | ---------------- | ------------------------------------------------------------ |
| `scheduling:manage` | Manage Schedules | Allows overriding timetables and resolving booking conflicts |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Highly dependent on `resource` and `event`.

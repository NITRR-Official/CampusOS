# Checkin Plugin API Reference

The `checkin` plugin provides attendance tracking, QR code generation, and manual registration logging for events.

## 1. Overview

- **Plugin ID**: `checkin`
- **Focus**: Attendance and physical presence validation.

## 2. Permissions Exported (RBAC)

The `checkin` plugin registers the following atomic permissions:

| Permission ID    | Label            | Description                                               |
| ---------------- | ---------------- | --------------------------------------------------------- |
| `checkin:manage` | Manage Check-ins | Allows scanning attendees and managing attendance records |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Requires `event` (attendance is scoped to events).

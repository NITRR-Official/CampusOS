# Resource Plugin API Reference

The `resource` plugin provides inventory management. It is used to track equipment, venues, and physical items that can be booked.

## 1. Overview

- **Plugin ID**: `resource`
- **Focus**: Equipment and venue booking.

## 2. Permissions Exported (RBAC)

The `resource` plugin registers the following atomic permissions:

| Permission ID     | Label            | Description                                              |
| ----------------- | ---------------- | -------------------------------------------------------- |
| `resource:view`   | View Resources   | Allows viewing resource data                             |
| `resource:manage` | Manage Resources | Allows adding, removing, and updating physical resources |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Often used alongside `event` to book venues.

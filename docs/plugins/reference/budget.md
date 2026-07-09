# Budget Plugin API Reference

The `budget` plugin provides financial tracking, expense reporting, and resource allocation for clubs and events.

## 1. Overview

- **Plugin ID**: `budget`
- **Focus**: Financial management and ledgers.

## 2. Permissions Exported (RBAC)

The `budget` plugin registers the following atomic permissions:

| Permission ID   | Label          | Description                                                         |
| --------------- | -------------- | ------------------------------------------------------------------- |
| `budget:manage` | Manage Budgets | Allows creating, updating, and viewing financial ledgers for a club |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Requires `club` and `event` for financial context.

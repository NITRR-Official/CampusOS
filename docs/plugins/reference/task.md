# Task Plugin API Reference

The `task` plugin provides Kanban boards, to-do lists, and assignment tracking.

## 1. Overview

- **Plugin ID**: `task`
- **Focus**: Project management.

## 2. Permissions Exported (RBAC)

The `task` plugin registers the following atomic permissions:

| Permission ID | Label        | Description                                                        |
| ------------- | ------------ | ------------------------------------------------------------------ |
| `task:view`   | View Tasks   | Allows viewing task boards and assignments                         |
| `task:manage` | Manage Tasks | Allows creating task boards, assigning members, and deleting tasks |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Requires `club`.

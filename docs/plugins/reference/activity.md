# Activity Plugin

The Activity plugin handles system-wide activity feeds, audit logging, and user notifications. It tracks when critical events happen (like a new vendor being registered or an event being deleted) and broadcasts them to relevant users or dashboards.

## Architecture Layer

**1. Foundation Layer**

## Collections

- `Activity`: Stores the activity log entries (action type, actor, target entity, timestamp).

## Events

- **Listens for**: Nearly all core domain events (e.g., `club:created`, `vendor:updated`) to log them.

## Permissions

- `activity:view`: Allows a user to view the activity feed for their authorized context (e.g., their club).
- `activity:manage`: Allows an administrator to delete or archive activity logs.

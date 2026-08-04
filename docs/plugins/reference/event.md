# Event Plugin API Reference

The `event` plugin handles creating, publishing, and registering for events. It is intrinsically tied to the `club` plugin, as events must be hosted by a specific organization.

## 1. Overview

- **Plugin ID**: `event`
- **Exposed Routes**:
  - `GET /api/v1/events`
  - `GET /api/v1/events/:eventId`
  - `POST /api/v1/events/:eventId/publish`
  - `POST /api/v1/events/:eventId/unpublish`
  - `GET /api/v1/events/:eventId/registrations`

## 2. Permissions Exported (RBAC)

The `event` plugin registers the following atomic permissions to the CampusOS core:

| Permission ID  | Label         | Description                                     |
| -------------- | ------------- | ----------------------------------------------- |
| `event:view`   | View Events   | Allows viewing events data                      |
| `event:create` | Create Events | Allows creating new events for a club           |
| `event:manage` | Manage Events | Allows editing, publishing, and deleting events |

## 3. Services Exported

Currently, the `event` plugin operates as a REST API and relies on the unified Mongoose schemas. It does not export explicit JavaScript functions to the `registry`.

## 4. Required Dependencies

The `event` plugin implicitly requires the `club` plugin to operate successfully, as all events are scoped under a `clubId`. Make sure `club` is booted before `event`.

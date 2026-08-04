# Club Plugin API Reference

The `club` plugin is the foundational layer for organizing users into distinct, isolated communities (Clubs/Organizations). It handles member rosters, role creation, and permission assignments.

## 1. Overview

- **Plugin ID**: `club`
- **Exposed Routes**:
  - `GET /api/v1/clubs`
  - `GET /api/v1/clubs/:clubId/members`
  - `DELETE /api/v1/clubs/:clubId/members/:memberUserId`
  - `PUT /api/v1/clubs/:clubId/members/:memberUserId/role`

## 2. Permissions Exported (RBAC)

The `club` plugin registers the following atomic permissions to the CampusOS core. You can assign these permissions to custom roles within the UI.

| Permission ID   | Label                | Description                                                    |
| --------------- | -------------------- | -------------------------------------------------------------- |
| `club:manage`   | Manage Club Settings | Allows editing core club details like description and category |
| `member:manage` | Manage Members       | Allows kicking members and assigning basic roles               |
| `role:manage`   | Manage Roles         | Allows creating custom roles and editing the role hierarchy    |

## 3. Services Exported

Currently, the `club` plugin operates as a REST API and relies on the unified Mongoose schemas. It does not export explicit JavaScript functions to the `registry`.

## 4. Events Emitted

The `club` plugin manages its state internally and currently does not emit EventBus events.

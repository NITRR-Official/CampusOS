---
title: 'REST API Reference'
---

# REST API Reference

Comprehensive endpoint reference for the CampusOS backend engine and all modular plugins.

Base URL: `http://localhost:4000` (development) or `https://api.campusos.edu` (production)  
All responses follow either **Pattern A** (Wrapped envelope with `{ success, data }`) or **Pattern B** (Direct payload with HTTP status codes). Refer to [API Standards](/docs/guides/API_STANDARDS) for details.

---

## Table of Contents

- [Core System Endpoints](#core-system-endpoints)
- [Authentication & Users (`auth`)](#authentication--users-auth)
- [Club Management (`club`)](#club-management-club)
- [Event Management (`event`)](#event-management-event)
- [Calendar & Scheduling (`calendar`)](#calendar--scheduling-calendar)
- [Task & Kanban Management (`task`)](#task--kanban-management-task)
- [Dynamic Forms (`forms`)](#dynamic-forms-forms)
- [QR Check-in & Attendance (`checkin`)](#qr-check-in--attendance-checkin)
- [Recruitment & Applications (`recruitment`)](#recruitment--applications-recruitment)
- [Activity Feeds & Audit (`activity`)](#activity-feeds--audit-activity)
- [Institute & Campus Structure (`institute`)](#institute--campus-structure-institute)
- [Plugin Manager (`plugin-manager`)](#plugin-manager-plugin-manager)
- [Vendor Operations (`vendor`)](#vendor-operations-vendor)
- [Resource & Inventory (`resource`)](#resource--inventory-resource)
- [Scheduling & Room Conflicts (`scheduling`)](#scheduling--room-conflicts-scheduling)
- [Budget & Financials (`budget`)](#budget--financials-budget)

---

## Core System Endpoints

System discovery, health probes, and plugin runtime assets.

| Method | Endpoint                          | Permissions / Auth | Description                                                           |
| ------ | --------------------------------- | ------------------ | --------------------------------------------------------------------- |
| `GET`  | `/health`                         | Public             | Returns database connection status and health probe                   |
| `GET`  | `/api/v1/system/modules`          | Public             | Discovers currently loaded and active plugin modules                  |
| `GET`  | `/api/v1/system/permissions`      | Public             | Returns all dynamically registered RBAC permissions grouped by module |
| `GET`  | `/api/v1/system/stats`            | Authenticated      | Aggregates dashboard KPI stats from all active plugin stat providers  |
| `GET`  | `/api/v1/plugins/:name/manifest`  | Public             | Fetches plugin manifest (`plugin.json`) for frontend runtime          |
| `GET`  | `/api/v1/plugins/:name/bundle.js` | Public             | Streams compiled frontend ESM micro-bundle for client injection       |

---

## Authentication & Users (`auth`)

User authentication, session verification, and administrator role assignment.

| Method  | Endpoint                   | Permissions / Auth    | Description                                            |
| ------- | -------------------------- | --------------------- | ------------------------------------------------------ |
| `POST`  | `/api/v1/auth/signup`      | Public (Rate Limited) | Register a new user account                            |
| `POST`  | `/api/v1/auth/login`       | Public (Rate Limited) | Authenticate user credentials and receive JWT          |
| `GET`   | `/api/v1/auth/me`          | Authenticated         | Get current authenticated user profile and permissions |
| `GET`   | `/api/v1/users`            | `requireSuperAdmin`   | List all users across the institute                    |
| `PATCH` | `/api/v1/users/:id/role`   | `requireSuperAdmin`   | Update system-level role of a user                     |
| `PATCH` | `/api/v1/users/:id/status` | `requireSuperAdmin`   | Suspend or activate a user account                     |

---

## Club Management (`club`)

Club onboarding, multi-role approval workflow state machine, membership, and custom club roles.

| Method   | Endpoint                                     | Permissions / Auth               | Description                                                |
| -------- | -------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| `GET`    | `/api/v1/clubs`                              | Authenticated                    | List all active or pending clubs                           |
| `POST`   | `/api/v1/clubs`                              | Authenticated                    | Submit club creation request (initiates approval pipeline) |
| `GET`    | `/api/v1/clubs/verify`                       | Public                           | Verify club advisor or creator email token                 |
| `PATCH`  | `/api/v1/clubs/:clubId`                      | `club:manage`                    | Update club profile, bio, and metadata                     |
| `POST`   | `/api/v1/clubs/:clubId/archive`              | Authenticated                    | Archive an active club                                     |
| `GET`    | `/api/v1/clubs/:clubId/my-permissions`       | Authenticated                    | Get caller's atomic permissions within this club context   |
| `PATCH`  | `/api/v1/clubs/:clubId/approve`              | `requireSuperAdmin`              | Approve pending club registration                          |
| `PATCH`  | `/api/v1/clubs/:clubId/reject`               | `requireSuperAdmin`              | Reject pending club registration                           |
| `GET`    | `/api/v1/clubs/:clubId/members`              | `club:manage` or `member:manage` | List club members and their roles                          |
| `POST`   | `/api/v1/clubs/:clubId/members`              | `member:manage`                  | Add a member to the club roster                            |
| `DELETE` | `/api/v1/clubs/:clubId/members/:userId`      | `member:manage`                  | Remove a member from the club                              |
| `PATCH`  | `/api/v1/clubs/:clubId/members/:userId/role` | `role:manage`                    | Assign custom role to a member                             |
| `GET`    | `/api/v1/clubs/:clubId/roles`                | `role:manage` or `club:manage`   | List all custom roles defined in club                      |
| `POST`   | `/api/v1/clubs/:clubId/roles`                | `role:manage`                    | Create a new custom role with atomic permissions           |
| `PATCH`  | `/api/v1/clubs/:clubId/roles/:roleId`        | `role:manage`                    | Update role permissions and title                          |
| `DELETE` | `/api/v1/clubs/:clubId/roles/:roleId`        | `role:manage`                    | Delete a custom role                                       |

---

## Event Management (`event`)

Event creation, drafts, publishing lifecycle, and RSVP registration tickets.

| Method  | Endpoint                                | Permissions / Auth  | Description                              |
| ------- | --------------------------------------- | ------------------- | ---------------------------------------- |
| `GET`   | `/api/v1/events`                        | `event:view`        | List internal events for dashboard       |
| `GET`   | `/api/v1/events/public`                 | Public              | List all published public campus events  |
| `GET`   | `/api/v1/events/:eventId`               | `event:view`        | Get event details with internal metadata |
| `GET`   | `/api/v1/events/:eventId/public`        | Public              | Get public event landing data            |
| `POST`  | `/api/v1/events`                        | `event:create`      | Create a new event draft                 |
| `PATCH` | `/api/v1/events/:eventId`               | `event:manage`      | Update event information and banner      |
| `POST`  | `/api/v1/events/:eventId/publish`       | `event:manage`      | Publish draft event to campus catalog    |
| `POST`  | `/api/v1/events/:eventId/unpublish`     | `event:manage`      | Revert event back to draft               |
| `POST`  | `/api/v1/events/:eventId/registrations` | Authenticated       | Register/RSVP for an event               |
| `GET`   | `/api/v1/events/:eventId/registrations` | `event:manage`      | List registered attendees                |
| `GET`   | `/api/v1/admin/events`                  | `requireSuperAdmin` | Cross-institute global event oversight   |

---

## Calendar & Scheduling (`calendar`)

Persistent calendar event storage, date-range timeline queries, and multi-club calendar synchronization.

| Method   | Endpoint                    | Permissions / Auth | Description                                                |
| -------- | --------------------------- | ------------------ | ---------------------------------------------------------- |
| `GET`    | `/api/v1/calendar`          | Authenticated      | List all accessible calendar events                        |
| `GET`    | `/api/v1/calendar/range`    | Authenticated      | Query events within a date interval (`?start=ISO&end=ISO`) |
| `GET`    | `/api/v1/calendar/:eventId` | Authenticated      | Get calendar item metadata and recurrence rules            |
| `POST`   | `/api/v1/calendar`          | `calendar:manage`  | Schedule a calendar event entry                            |
| `DELETE` | `/api/v1/calendar/:eventId` | `calendar:manage`  | Delete an entry from the calendar                          |

---

## Task & Kanban Management (`task`)

Kanban task workflow, task assignments, deadline priority, and dependency graphs.

| Method   | Endpoint                             | Permissions / Auth | Description                                              |
| -------- | ------------------------------------ | ------------------ | -------------------------------------------------------- |
| `GET`    | `/api/v1/tasks`                      | `task:view`        | List tasks filtered by club or event                     |
| `GET`    | `/api/v1/tasks/:taskId`              | `task:view`        | Get task details, checklist, and history                 |
| `POST`   | `/api/v1/tasks`                      | `task:manage`      | Create a new task                                        |
| `PATCH`  | `/api/v1/tasks/:taskId/assign`       | `task:manage`      | Assign task to user(s)                                   |
| `PATCH`  | `/api/v1/tasks/:taskId/status`       | `task:manage`      | Update task status (`TODO`, `IN_PROGRESS`, `DONE`)       |
| `PATCH`  | `/api/v1/tasks/:taskId/priority`     | `task:manage`      | Update task priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) |
| `POST`   | `/api/v1/tasks/:taskId/dependencies` | `task:manage`      | Add a prerequisite blocking task                         |
| `DELETE` | `/api/v1/tasks/:taskId/dependencies` | `task:manage`      | Remove a prerequisite task dependency                    |

---

## Dynamic Forms (`forms`)

Dynamic drag-and-drop form schema builder, survey responses, and attendee data collection.

| Method | Endpoint                                      | Permissions / Auth | Description                                   |
| ------ | --------------------------------------------- | ------------------ | --------------------------------------------- |
| `GET`  | `/api/v1/forms`                               | `form:view`        | List forms created under a club or event      |
| `POST` | `/api/v1/forms`                               | `form:manage`      | Create a new form with JSON schema fields     |
| `GET`  | `/api/v1/forms/:formId`                       | `form:view`        | Get form schema for preview or editing        |
| `PUT`  | `/api/v1/forms/:formId`                       | `form:manage`      | Update form fields, validation, and deadlines |
| `GET`  | `/api/v1/forms/:formId/responses`             | `form:manage`      | List all submitted responses                  |
| `GET`  | `/api/v1/forms/:formId/responses/:responseId` | `form:manage`      | Get detailed submission answers               |
| `POST` | `/api/v1/forms/:formId/responses`             | `forms:submit`     | Submit answers to a form                      |

---

## QR Check-in & Attendance (`checkin`)

Real-time QR code ticket generation, mobile camera scanning, and event attendance reconciliation.

| Method | Endpoint                                          | Permissions / Auth | Description                                 |
| ------ | ------------------------------------------------- | ------------------ | ------------------------------------------- |
| `GET`  | `/api/v1/events/:eventId/checkins`                | `checkin:manage`   | List all check-in entries for an event      |
| `POST` | `/api/v1/events/:eventId/checkins`                | `checkin:manage`   | Manually mark an attendee as checked in     |
| `GET`  | `/api/v1/events/:eventId/checkins/status/:userId` | Authenticated      | Check if a specific attendee is checked in  |
| `POST` | `/api/v1/checkins/scan`                           | Authenticated      | Validate signed QR payload and verify entry |
| `GET`  | `/api/v1/events/:eventId/attendance-stats`        | `checkin:manage`   | Live attendance metrics and turnover        |

---

## Recruitment & Applications (`recruitment`)

Club member recruitment drives, application screening, multi-stage interviews, and status pipelines.

| Method  | Endpoint                                                                   | Permissions / Auth   | Description                           |
| ------- | -------------------------------------------------------------------------- | -------------------- | ------------------------------------- |
| `GET`   | `/api/v1/recruitment/campaigns`                                            | `recruitment:view`   | List recruitment drives               |
| `POST`  | `/api/v1/recruitment/campaigns`                                            | `recruitment:manage` | Launch a new recruitment campaign     |
| `GET`   | `/api/v1/recruitment/campaigns/:campaignId`                                | `recruitment:view`   | Get campaign details and timeline     |
| `PUT`   | `/api/v1/recruitment/campaigns/:campaignId`                                | `recruitment:manage` | Update campaign rounds and criteria   |
| `GET`   | `/api/v1/recruitment/campaigns/:campaignId/candidates`                     | `recruitment:manage` | List applicants for campaign          |
| `GET`   | `/api/v1/recruitment/campaigns/:campaignId/candidates/:candidateId`        | `recruitment:manage` | View applicant profile and scorecards |
| `PATCH` | `/api/v1/recruitment/campaigns/:campaignId/candidates/:candidateId/status` | `recruitment:manage` | Advance or reject applicant stage     |
| `PATCH` | `/api/v1/recruitment/campaigns/:campaignId/candidates/:candidateId/notes`  | `recruitment:manage` | Add interviewer feedback notes        |

---

## Activity Feeds & Audit (`activity`)

Immutable audit trails, club activity feeds, and user-centric notifications.

| Method | Endpoint                            | Permissions / Auth | Description                                           |
| ------ | ----------------------------------- | ------------------ | ----------------------------------------------------- |
| `GET`  | `/api/v1/activity/global`           | `activity:view`    | System-wide audit log of administrative actions       |
| `GET`  | `/api/v1/activity/me`               | Authenticated      | Personalized activity feed for current user           |
| `GET`  | `/api/v1/activity/entity/:entityId` | `activity:view`    | Chronological activity feed for a specific club/event |

---

## Institute & Campus Structure (`institute`)

Campus departments, academic terms, and venue hierarchy configuration.

| Method | Endpoint             | Permissions / Auth  | Description                                   |
| ------ | -------------------- | ------------------- | --------------------------------------------- |
| `GET`  | `/api/v1/institutes` | Authenticated       | List campus entities, branches, and venues    |
| `POST` | `/api/v1/institutes` | `requireSuperAdmin` | Register a new campus institute or department |

---

## Plugin Manager (`plugin-manager`)

Runtime plugin management, hot toggle enablement, and graceful server restarts.

| Method  | Endpoint                         | Permissions / Auth | Description                                                     |
| ------- | -------------------------------- | ------------------ | --------------------------------------------------------------- |
| `GET`   | `/api/v1/plugins`                | `super-admin`      | List all discovered plugins with enabled status and tier        |
| `PUT`   | `/api/v1/plugins/:name/toggle`   | `super-admin`      | Enable or disable a plugin in MongoDB                           |
| `PATCH` | `/api/v1/plugins/:name/settings` | `super-admin`      | Update plugin-specific runtime settings                         |
| `POST`  | `/api/v1/plugins/restart`        | `super-admin`      | Gracefully restart Express server (`SIGTERM`) to reload plugins |

---

## Vendor Operations (`vendor`)

Procurement vendors, event equipment suppliers, assignment workflows, and performance ratings.

| Method   | Endpoint                                           | Permissions / Auth | Description                                                    |
| -------- | -------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| `POST`   | `/api/v1/vendors`                                  | `vendor:manage`    | Register a new vendor profile                                  |
| `GET`    | `/api/v1/vendors`                                  | `vendor:view`      | List all verified suppliers                                    |
| `GET`    | `/api/v1/vendors/:vendorId`                        | `vendor:view`      | Get vendor details, contact, and rating                        |
| `PUT`    | `/api/v1/vendors/:vendorId`                        | `vendor:manage`    | Update vendor information                                      |
| `DELETE` | `/api/v1/vendors/:vendorId`                        | `vendor:manage`    | Delete vendor profile                                          |
| `POST`   | `/api/v1/events/:eventId/vendors/:vendorId`        | `vendor:manage`    | Assign vendor to deliver services for an event                 |
| `GET`    | `/api/v1/events/:eventId/vendors`                  | `vendor:view`      | List vendors contracted for an event                           |
| `GET`    | `/api/v1/vendors/:vendorId/assignments`            | `vendor:view`      | List historical event engagements                              |
| `PUT`    | `/api/v1/vendors/assignments/:assignmentId/status` | `vendor:manage`    | Update engagement status (`PENDING`, `CONFIRMED`, `COMPLETED`) |
| `POST`   | `/api/v1/vendors/:vendorId/rate`                   | Authenticated      | Submit vendor quality feedback and rating                      |

---

## Resource & Inventory (`resource`)

Campus physical inventory, audiovisual equipment tracking, maintenance schedules, and event reservations.

| Method   | Endpoint                                             | Permissions / Auth | Description                                                     |
| -------- | ---------------------------------------------------- | ------------------ | --------------------------------------------------------------- |
| `POST`   | `/api/v1/resources`                                  | `resource:manage`  | Register equipment item into inventory                          |
| `GET`    | `/api/v1/resources`                                  | `resource:view`    | List all campus resources with availability counts              |
| `GET`    | `/api/v1/resources/:resourceId`                      | `resource:view`    | Get resource specifications and reservation status              |
| `PUT`    | `/api/v1/resources/:resourceId`                      | `resource:manage`  | Update resource details                                         |
| `DELETE` | `/api/v1/resources/:resourceId`                      | `resource:manage`  | Remove item from inventory                                      |
| `POST`   | `/api/v1/events/:eventId/resources/:resourceId`      | `resource:manage`  | Reserve resource for an event                                   |
| `GET`    | `/api/v1/events/:eventId/resources`                  | `resource:view`    | List items allocated to an event                                |
| `GET`    | `/api/v1/resources/:resourceId/allocations`          | `resource:view`    | View upcoming reservation schedule for item                     |
| `PUT`    | `/api/v1/resources/allocations/:allocationId/status` | `resource:manage`  | Update allocation status (`RESERVED`, `DISPATCHED`, `RETURNED`) |
| `PUT`    | `/api/v1/resources/:resourceId/maintenance`          | `resource:manage`  | Log maintenance date and condition                              |

---

## Scheduling & Room Conflicts (`scheduling`)

Time slot reservations, automated conflict detection algorithms, and venue availability queries.

| Method   | Endpoint                                         | Permissions / Auth  | Description                                          |
| -------- | ------------------------------------------------ | ------------------- | ---------------------------------------------------- |
| `POST`   | `/api/v1/events/:eventId/schedule`               | `scheduling:manage` | Book a time slot for an event                        |
| `GET`    | `/api/v1/events/:eventId/schedule`               | Public              | View full timeline schedule for an event             |
| `GET`    | `/api/v1/schedule/:slotId`                       | Public              | Get specific time slot details                       |
| `PUT`    | `/api/v1/schedule/:slotId`                       | `scheduling:manage` | Reschedule or adjust time slot boundaries            |
| `DELETE` | `/api/v1/schedule/:slotId`                       | `scheduling:manage` | Cancel scheduled time slot                           |
| `GET`    | `/api/v1/schedule/conflicts`                     | Authenticated       | List all overlapping room or time conflicts          |
| `GET`    | `/api/v1/schedule/:slotId/conflicts`             | Authenticated       | Check if a specific slot clashes with other bookings |
| `PUT`    | `/api/v1/schedule/conflicts/:conflictId/resolve` | `scheduling:manage` | Mark a venue conflict as resolved                    |
| `GET`    | `/api/v1/schedule/venue/:venue/available`        | Authenticated       | Query room availability for a given window           |
| `GET`    | `/api/v1/events/:eventId/schedule/overview`      | Public              | High-level schedule overview with milestones         |

---

## Budget & Financials (`budget`)

Event financial ledgers, line-item expense tracking, approval workflows, and budget vs actual variance reports.

| Method | Endpoint                                      | Permissions / Auth | Description                                     |
| ------ | --------------------------------------------- | ------------------ | ----------------------------------------------- |
| `POST` | `/api/v1/events/:eventId/budget`              | `budget:manage`    | Initialize budget ledger for an event           |
| `GET`  | `/api/v1/events/:eventId/budget`              | `budget:view`      | Get budget ledger and allocated line items      |
| `GET`  | `/api/v1/budget/:budgetId`                    | `budget:view`      | Get budget record by ID                         |
| `PUT`  | `/api/v1/budget/:budgetId`                    | `budget:manage`    | Update budget target totals                     |
| `POST` | `/api/v1/budget/:budgetId/approve`            | `budget:manage`    | Authorize and lock event budget                 |
| `POST` | `/api/v1/budget/:budgetId/reject`             | `budget:manage`    | Reject budget proposal                          |
| `POST` | `/api/v1/budget/:budgetId/expense`            | `budget:manage`    | Record an incurred expense                      |
| `GET`  | `/api/v1/budget/:budgetId/expenses`           | `budget:view`      | List all expense receipts logged against budget |
| `GET`  | `/api/v1/budget/expense/:expenseId`           | `budget:view`      | Get individual expense details                  |
| `PUT`  | `/api/v1/budget/expense/:expenseId`           | `budget:manage`    | Modify expense entry                            |
| `POST` | `/api/v1/budget/expense/:expenseId/mark-paid` | `budget:manage`    | Mark logged expense invoice as paid             |
| `GET`  | `/api/v1/budget/:budgetId/summary`            | `budget:view`      | Aggregate financial breakdown                   |
| `GET`  | `/api/v1/budget/:budgetId/vs-actual`          | `budget:view`      | In-depth budget vs actual variance analysis     |

---

**See Also**: [API Standards Guide](/docs/guides/API_STANDARDS) · [Backend Architecture](/docs/architecture/BACKEND) · [Security Guidelines](/docs/guides/SECURITY)

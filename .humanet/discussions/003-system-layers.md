# System Layers Architecture

## Status

Accepted

## Overview

CampusOS is organized into 6 functional layers, each handling a specific concern.

## 1. Foundation Layer

**Purpose**: Core identity and permissions

**Modules**

- Auth (JWT-based authentication)
- Users (user profiles and management)
- Institutes (organization management)
- Clubs (organizational structure)
- RBAC (role-based access control)

**Dependencies**: None (base layer)

---

## 2. Event Layer

**Purpose**: Event lifecycle management

**Modules**

- Events (create, manage events)
- RSVP (registrations and attendance)
- Check-in (event day attendance tracking)

**Dependencies**: Foundation Layer

---

## 3. Execution Layer

**Purpose**: Task and workflow management

**Modules**

- Tasks (create and assign tasks)
- Calendar (deadline and schedule management)
- Workflows (task execution states)

**Dependencies**: Foundation Layer, Event Layer

---

## 4. Operations Layer

**Purpose**: Resource, vendor, and budget management

**Modules**

- Vendor (vendor management and procurement)
- Resource (resource allocation and scheduling)
- Budget (expense and budget tracking)

**Dependencies**: Foundation Layer, Event Layer

---

## 5. Growth Layer

**Purpose**: Sponsorship and marketing

**Modules**

- Sponsorship (sponsor management and tracking)
- Marketing (campaign management and assets)

**Dependencies**: All previous layers

---

## 6. System Layer

**Purpose**: Cross-cutting concerns

**Systems**

- Notifications (real-time alerts)
- Audit Logs (security and compliance)
- File Management (asset storage)
- Analytics (reporting and dashboards)

**Dependencies**: All layers (provides services to all)

---

## Phase-to-Layer Mapping

| Phase   | Layers Involved |
| ------- | --------------- |
| Phase 0 | (Setup)         |
| Phase 1 | Foundation      |
| Phase 2 | Event           |
| Phase 3 | Execution       |
| Phase 4 | Operations      |
| Phase 5 | Growth          |
| Phase 6 | System Maturity |

---

## Rationale

1. **Clear Separation** — Each layer has distinct responsibility
2. **Dependency Flow** — Lower layers don't depend on higher layers
3. **Scalable** — Easy to add new modules within a layer
4. **Testable** — Can test each layer independently

---

## Related ADRs

- ADR-001: Technology Stack Selection
- ADR-002: Multi-Tenant Architecture (DEPRECATED)
- ADR-004: Development Strategy
- ADR-005: Removing Multi-Tenant Architecture

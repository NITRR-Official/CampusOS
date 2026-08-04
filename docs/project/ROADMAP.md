# CampusOS Roadmap

CampusOS is built in phases, each expanding the platform's capabilities. Each phase completes backend modules, frontend integration, and documentation before the next begins.

---

## ✅ Phase 0: System Initialization — Complete

Set up monorepo structure, Express server with plugin loader, Next.js frontend shell, MongoDB connection, and development environment.

## ✅ Phase 1: Foundation System — Complete

**Modules**: Auth (JWT), Club, Institute, Admin, Plugin Manager, Activity, RBAC

Functional login system, club management, system configurations, dynamic plugin CLI, activity feeds, and atomic role-based access control.

## ✅ Phase 2: Event Engine — Complete

**Modules**: Event, Check-in, Forms

Event CRUD, registration with capacity handling, QR check-in, and dynamic schema-driven form building.

## ✅ Phase 3: Execution Engine — Complete

**Modules**: Task, Calendar, Recruitment

Task assignment with priority, calendar management, and recruitment campaigns for onboarding new members.

## ✅ Phase 5: Operations Layer — Complete

**Modules**: Vendor, Resource, Scheduling, Budget

| Module     | Endpoints | Key Features                                       |
| ---------- | --------- | -------------------------------------------------- |
| Vendor     | 10        | CRUD, event assignments, rating system             |
| Resource   | 11        | Inventory, allocation, conflict detection          |
| Scheduling | 10        | Time slots, venue availability, conflict detection |
| Budget     | 13        | Allocation, expenses, approval workflow, reporting |

**Total: 44 REST API endpoints.** See [API Reference](../api/REFERENCE.md) for details.

---

## 🟢 Phase 6: The V1 Launch (NIT Raipur)

**Goal**: Make the existing Core and Domain plugins predictable, secure, and production-ready for the upcoming semester.

- [ ] **Feature Completion:** Fix known logic regressions (e.g., Forms validation) and enforce dynamic entity-level RBAC across all endpoints.
- [ ] **Manual Testing:** Dogfood the platform with 3-5 real clubs to find UX edge cases.
- [ ] **Architecture Audit:** Run anti-pattern checks and ensure strict decoupling (Core vs Domain plugins).
- [ ] **Security & Pentesting:** Conduct vulnerability assessments (IDOR, XSS, Privacy).
- [ ] **Automated Testing:** Implement unit, integration, and E2E testing for critical lifecycles.
- [ ] **Launch:** Deploy on free-tier infrastructure (Cloudflare R2, MongoDB Atlas) and open source the v1 release!

---

## Milestones

| #   | Milestone              | Status      |
| --- | ---------------------- | ----------- |
| 1   | Foundation Ready       | ✅ Complete |
| 2   | Event System Live      | ✅ Complete |
| 3   | Execution System Ready | ✅ Complete |
| 4   | First Fest Ready 🎪    | ✅ Complete |
| 5   | Full Ops System        | ✅ Complete |
| 5.5 | Architecture Migration | ✅ Complete |
| 6   | The V1 Launch          | 🚀 Next     |
| 7   | Enterprise Workflows   | 🚀 Planned  |

---

**See Also**: [Scope](./SCOPE.md) · [Problem Statement](./PROBLEM_STATEMENT.md) · [Project Structure](./PROJECT_STRUCTURE.md)

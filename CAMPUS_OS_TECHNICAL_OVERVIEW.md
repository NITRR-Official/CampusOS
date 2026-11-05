# CampusOS Technical Overview

## 1. PROJECT IDENTITY

- **Project name**: CampusOS
- **Description**: The Operating System for Campus Management — A modular, open-source platform that replaces fragmented tools (WhatsApp groups, Google Sheets, email) with a single system for managing clubs, events, tasks, operations, and growth.
- **Main purpose**: Manage campus activities in a single platform, avoiding fragmented tools.
- **Target users**: Institutes, Campus Clubs, Students, Administrators, Vendors.
- **Current status**: Phase 5 Complete, preparing for V1 Launch (Production-ready).
- **Main platforms**: Web (Backend API + Frontend App)

## 2. TECH STACK

| Layer            | Technology               | Version          | Purpose                                        |
| ---------------- | ------------------------ | ---------------- | ---------------------------------------------- |
| Frontend         | Next.js + React          | 16.2.2 / 19.2.4  | Server-side rendering, routing, UI layer       |
| Backend          | Node.js + Express        | >= 18 / 5.2.1    | API server, middleware pipeline, plugin loader |
| Database         | MongoDB + Mongoose       | 9.6.1            | Flexible document storage                      |
| Authentication   | JWT (HS256)              | -                | Stateless session management                   |
| Storage          | -                        | -                | (Cloudflare R2 planned for V1)                 |
| APIs             | REST API                 | -                | Communication between frontend and backend     |
| State management | Zustand + React Query    | 5.0.14 / 5.101.2 | Global state and server state caching          |
| Styling/UI       | Tailwind CSS + shadcn/ui | v4 / 4.6.0       | Utility-first styling, component library       |
| Build/deployment | pnpm (workspaces)        | 10.25.0          | Monorepo package management                    |
| Testing          | Vitest                   | 1.6.1            | Testing framework (configured, 0% coverage)    |
| Validation       | Zod                      | 3.25.76          | Type-safe schema validation (front/back)       |

## 3. REPOSITORY STRUCTURE

```text
CampusOS/
├── backend/            → Express server, middleware, DB connect, plugin loader.
├── docs/               → Project documentation (architecture, roadmap).
├── frontend/           → Next.js web application (App router, components).
├── packages/           → Additional shared tools.
├── plugins/            → Core feature modules (auth, club, event, budget, etc.).
└── shared/             → Shared types, API clients, and common auth logic.
```

## 4. ARCHITECTURE

CampusOS is built on a modular, plugin-based monolithic architecture.

- **Frontend architecture**: Next.js App Router using React Query for data fetching and Zustand for global UI state.
- **Backend architecture**: Express application that acts as a shell. All business logic lives in `/plugins/`. The core handles middleware, plugin loading, database connection, and a service registry.
- **Database architecture**: MongoDB with Mongoose. Each plugin defines its own schemas.
- **Communication**: Plugins CANNOT import each other directly. They communicate via a dynamic Service Registry and an in-memory EventBus.

```text
User
 ↓ (HTTP)
Next.js Frontend (React Query, Zustand)
 ↓ (REST API)
Express Server (Middleware: Auth, Logger, CORS, Rate Limit)
 ↓
Plugin Loader (Resolves dependencies, loads dynamically)
 ↓ (Service Registry & EventBus)
Plugin Modules (Auth, Event, Club, Task, etc.)
 ↓
Mongoose Models
 ↓
MongoDB
```

## 5. APPLICATION FLOW

- **Application startup**: `backend/src/index.js` connects to MongoDB -> creates Express app -> loads middleware -> reads `/plugins/` -> parses `plugin.json` -> resolves dependencies -> sorts topologically -> initializes each plugin via `init()` -> registers routes -> starts server.
- **Authentication/Login**: User submits form -> Frontend sends POST `/api/v1/auth/login` -> Auth plugin validates credentials -> issues JWT -> returns token -> Frontend stores token in `Secure` cookies and React context.
- **Fetching data**: React Component -> React Query (cache) -> Axios client (`shared/src/api-client.ts`) with Bearer token -> Backend Route -> Middleware validates JWT -> Service fetches from Mongoose -> returns JSON -> React Query updates state.

## 6. CURRENT FEATURES

### Foundation & Auth (Fully Implemented)

- JWT Authentication (Login/Signup)
- User Profiles
- Institute & Club creation
- Activity feeds (Global, User, Entity)
- Atomic Role-Based Access Control (RBAC)
- Plugin Manager (Enable/Disable modules dynamically)

### Academics & Events (Fully Implemented)

- Event CRUD
- Event Registration (RSVP, Capacity limits)
- Dynamic Forms builder and responses
- QR Check-in & Attendance tracking

### Execution & Operations (Fully Implemented)

- Task assignment & workflows
- Calendar & Scheduling
- Resource management & allocation
- Vendor procurement
- Budget tracking (allocation, expenses)
- Recruitment campaigns

### Growth (Planned - Phase 6/7)

- Sponsorship management
- Marketing module

## 7. USER ROLES & PERMISSIONS

Implemented as dynamic, atomic entity-level RBAC.

- **SuperAdmin**: Full system access, can manage plugins and global settings.
- **Institute Admin**: Can manage clubs, institute settings.
- **Club Admin**: Can manage club settings, roles, members, create events, manage budgets.
- **Club Member**: Permissions are granular based on assigned roles (e.g., `event:create`, `budget:view`, `forms:submit`).
- **Student (Basic User)**: Can view public events, register for events, submit public forms.

Enforcement:

- Backend: `requirePermissions('permission:name')` middleware on routes.
- Frontend: Auth context provides current user roles to gate UI elements.

## 8. DATA MODEL

| Entity | Purpose              | Important fields                        | Relationships                     |
| ------ | -------------------- | --------------------------------------- | --------------------------------- |
| User   | System users         | name, email, passwordHash, isSuperAdmin | Members of Clubs                  |
| Club   | Campus organizations | name, institute, status                 | Has many Users, Events, Tasks     |
| Event  | Activities           | title, date, capacity, club             | Has many Registrations, Tasks     |
| Task   | Work items           | title, status, assignee, priority, club | Assigned to User, Belongs to Club |
| Budget | Financial tracking   | totalAllocation, currency, club         | Belongs to Club                   |

## 9. API / BACKEND SURFACE

_Important routes grouped by plugin:_

- **Auth**
  - `POST /api/v1/auth/login` -> validates user, returns JWT. (No Auth required)
  - `POST /api/v1/auth/register` -> creates User. (No Auth required)
- **Event**
  - `POST /api/v1/events` -> Create event. (Requires `event:create`)
  - `POST /api/v1/events/:id/register` -> RSVP for event.
- **Forms**
  - `POST /api/v1/forms` -> Create form. (Requires `form:manage`)
  - `POST /api/v1/forms/:id/responses` -> Submit response. (Requires `forms:submit`)
- **System**
  - `GET /api/v1/system/modules` -> Public list of active plugins. (No Auth)
  - `GET /api/v1/system/stats` -> Aggregated dashboard stats. (Requires Auth)

## 10. FRONTEND STRUCTURE

- **Routing**: Next.js App Router (`app/`). Separated into `(auth)` and `(dashboard)` route groups.
- **Components**: Reusable UI components in `frontend/components/` using shadcn/ui and Tailwind CSS.
- **State**:
  - Global UI state: `zustand`
  - Server state caching: `react-query`
  - Forms: `react-hook-form` + `zod`
- **Authentication**: `AuthProvider` wrapper across the application providing `user` and `token`.

## 11. STATE & DATA FLOW

`UI Component` (Local State / Forms) -> `React Query Mutation` (Optimistic UI update) -> `API Client` (`shared/src/api-client.ts`) -> `Express Backend Route` -> `Service Layer` -> `Mongoose` -> `MongoDB`.
On success, `React Query` invalidates relevant queries to fetch fresh server state.

## 12. AUTHENTICATION & SECURITY

- **Authentication**: Custom JWT (HS256) implementation. Token passed in `Authorization: Bearer` header and stored in `Secure` cookies.
- **Authorization**: Granular RBAC. Permissions checked via middleware `requirePermissions('domain:action')`.
- **Validation**: Strict schema validation at the controller level using `zod`.
- **Security Context**: Recent production audits fixed major flaws (e.g., Event Creation lacking guards, TOCTOU in budget service).
- **Risks**: No asymmetric crypto (RS256) yet. Event-Bus is in-memory; missing persistence.

## 13. EXTERNAL SERVICES & INTEGRATIONS

Currently, no third-party APIs (like Stripe or AWS S3) are integrated. Everything runs locally on MongoDB and Express.

- **Planned**: Cloudflare R2 for storage, Payment Gateway for ticketing.

## 14. CONFIGURATION & ENVIRONMENT

_Required Configuration (NAME ONLY):_

- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

## 15. DEPLOYMENT

- **Build**: `pnpm build` (builds Next.js frontend).
- **Start**: `pnpm -r --filter backend --filter frontend run dev` (development).
- **Database**: MongoDB requires a running instance (Docker or Atlas). Backend fails immediately if the DB connection fails.

## 16. TESTING

- **Testing framework**: Vitest is configured.
- **Existing tests**: None. Currently 0% coverage.
- **Future plans**: Phase 6 mandates E2E, integration, and unit tests for critical lifecycles.

## 17. CURRENT DEVELOPMENT STATE

- **Unfinished features**: Growth System (Sponsorship, Marketing).
- **Technical debt**: In-memory EventBus (needs Redis/Kafka), symmetric JWT (needs RS256).
- **Status**: Preparing for V1 Launch. Most critical security issues from the production audit have been patched.

## 18. ARCHITECTURAL CONSTRAINTS

- **Plugin Isolation**: Modules CANNOT import each other directly. Must use the service registry (`registry.getService(...)`).
- **MongoDB Dependency**: The entire system strictly relies on MongoDB.
- **Vertical Building**: New features must be built vertically (Schema -> Service -> Controller -> Routes), not horizontally.

## 19. IMPORTANT FILES TO KNOW

1. `backend/src/app.js` -> Express setup, middleware order, global error handling.
2. `backend/src/plugin-loader.js` -> Core logic for discovering, resolving dependencies, and loading plugins.
3. `shared/src/auth-provider.tsx` -> Frontend React Context for user sessions.
4. `shared/src/api-client.ts` -> Axios client wrapper used by frontend.
5. `backend/src/middleware/permissions.js` -> RBAC middleware (`requirePermissions`).
6. `backend/src/core/event-bus.js` -> In-memory event bus for cross-plugin communication.
7. `plugins/auth/backend/src/schema/user.schema.js` -> Core user data model.
8. `frontend/app/layout.tsx` -> Root Next.js layout, wraps app in providers.

## 20. FEATURE-PLANNING MAP

```text
New Feature (e.g., Sponsorships)
├── plugins/sponsorship/
│   ├── plugin.json (Manifest & dependencies)
│   ├── backend/
│   │   ├── src/
│   │   │   ├── schema/sponsorship.model.js
│   │   │   ├── service/sponsorship.service.js
│   │   │   ├── controller/sponsorship.controller.js
│   │   │   ├── routes/sponsorship.routes.js
│   │   │   └── index.js (Plugin init, registers service/routes)
│   ├── frontend/ (Optional if components are isolated)
└── frontend/app/(dashboard)/sponsorships/
    ├── page.tsx
    └── components/
```

## 21. ARCHITECTURAL RISKS

1. **Direct Imports Between Plugins**: Violates decoupled architecture. Will cause circular dependencies and break the plugin loader. Use `registry.getService()`.
2. **Synchronous EventBus Blocking**: Heavy tasks on the EventBus might block the Node.js event loop.
3. **Database Transactions**: Mongoose operations across different plugins might lack ACID transactions, leading to partial data states on failure.
4. **Missing Zod Validation**: Passing request data to services without strict input validation bypasses security standards.
5. **TOCTOU Races**: Always use atomic MongoDB operations (`$inc`, `$set`) rather than fetching, mutating, and saving.

## 22. SAFE CHANGE GUIDELINES

- "Feature code goes in `/plugins/`, not `backend/src/`."
- "No direct module imports across plugins. Use the registry or database."
- "Controllers must remain thin. Put business logic in the Service layer."
- "Protect all modifying routes with `requirePermissions('module:action')`."
- "Do not use `Object.assign` for updates. Use strict allowlists and `findByIdAndUpdate`."
- "Throw `AppError` in services and let the global error middleware handle the HTTP response."

## 23. QUICK AI CONTEXT

### CAMPUS OS — AI QUICK CONTEXT

**CampusOS** is a monolithic, plugin-based web application for campus management (clubs, events, tasks, operations). Built as a pnpm monorepo.
**Stack**: Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui, Zustand, React Query. Backend is Express v5, Node.js 18+, MongoDB, Mongoose, Zod.
**Architecture**: Strictly modular. Core (`backend/src/`) only handles middleware and loading. All features live in `/plugins/`. **Plugins cannot import each other directly**; they communicate via a service registry and an EventBus.
**Major Modules**: Auth, Club, Institute, Event, Task, Budget, Recruitment, Forms, Check-in.
**Roles/Auth**: JWT (HS256) auth. Granular entity-level RBAC. Endpoints protected via `requirePermissions()` middleware.
**Database**: MongoDB. Each plugin has its own Mongoose schemas.
**Constraints**: Do not build horizontally. Build vertically (Schema -> Service -> Controller -> Route). Never bypass the service registry for cross-plugin communication. Ensure Zod validation at the controller layer. Never throw generic objects; use `AppError`.
**Current State**: Foundation and Operations are complete (Phase 5). Preparing for V1 Production Launch. Zero test coverage currently (Vitest planned).
**Important Files**: `backend/src/plugin-loader.js` (how the system boots), `backend/src/app.js` (Express shell), `backend/src/core/event-bus.js`.

## 24. QUESTIONS / UNCERTAINTIES

1. QUESTION — How is file/image upload currently handled?
   _Why this matters: There is no clear storage configuration (AWS S3/Cloudflare R2) in `.env.example`, and no explicit storage plugin was found. Planning features that require images (event banners, user avatars) needs this clarified._
2. QUESTION — Where and how are emails/notifications dispatched?
   _Why this matters: Important for recruitment and task assignments. No SMTP or mailing service was explicitly seen configured in the codebase._
3. QUESTION — Is dynamic entity-level RBAC fully enforced across all endpoints?
   _Why this matters: The production audit mentioned verifying dynamic entity-level RBAC across all endpoints for V1 launch, implying it might be partially incomplete._

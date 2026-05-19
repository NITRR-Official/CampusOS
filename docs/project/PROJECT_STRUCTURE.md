# CampusOS Project Structure

How the repository is actually organized, verified against the filesystem.

## Root Directory

```
CampusOS/
├── apps/                       # Feature modules (plugins)
├── backend/                    # Express core server
├── frontend/                   # Next.js web application
├── shared/                     # Shared utilities package
├── docs/                       # Documentation (you are here)
├── .github/                    # CI workflows, issue templates, agent configs
├── .humanet/                   # Project governance docs (problem, idea, scope, ADRs)
│
├── package.json                # Root — pnpm workspaces, shared deps
├── pnpm-lock.yaml              # Lock file
├── README.md                   # Project gateway
├── ROADMAP.md                  # Development roadmap
├── COPILOT.md                  # AI development rules
├── CONTRIBUTING.md             # Contributor guide
├── CODE_OF_CONDUCT.md          # Community standards
├── CONTRIBUTORS.md             # Contributor list
└── .gitignore
```

### Workspace Configuration

Workspaces are defined in root `package.json` (not a separate `pnpm-workspace.yaml`):

```json
"workspaces": ["apps/*", "backend", "frontend", "shared"]
```

## Backend (`backend/`)

```
backend/
├── package.json                # @campus-os/backend — Express 5.2, JWT, CORS
└── src/
    ├── index.js                # Entry point — connectDB → createApp → startServer
    ├── app.js                  # Express app — middleware chain + plugin loading
    ├── server.js               # HTTP server — graceful shutdown, signal handling
    ├── plugin-loader.js        # Scans /apps/ for plugin.js or src/index.js
    │
    ├── auth/
    │   └── jwt-authenticator.js  # JWT sign/verify — registered as authenticator
    │
    ├── middleware/
    │   ├── auth.js             # JWT verification, public route whitelist
    │   ├── permissions.js      # requireRoles() — RBAC middleware factory
    │   ├── logger.js           # Request logging with trace IDs
    │   └── error.js            # Error handler + 404 handler
    │
    ├── database/
    │   ├── connection.js       # Mongoose connect/disconnect/healthCheck
    │   ├── migration-guide.js  # In-memory → MongoDB migration helpers
    │   └── schemas/
    │       ├── index.js        # Barrel export for all schemas
    │       ├── user.schema.js  # User model (for auth)
    │       ├── vendor.schema.js
    │       ├── resource.schema.js
    │       ├── scheduling.schema.js  # TimeSlot + Conflict models
    │       └── budget.schema.js      # Budget + Expense models
    │
    └── utils/
        └── registry.js         # ModuleRegistry — service locator singleton
```

**Key**: Backend uses Express **v5** (5.2.1), not v4.

## Frontend (`frontend/`)

```
frontend/
├── package.json                # Next.js 16.2.2, React 19, TypeScript, Tailwind v4
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS v4 config
├── tsconfig.json
├── components.json             # shadcn/ui configuration
│
├── app/                        # Next.js App Router (pages)
│   ├── layout.tsx              # Root layout — Geist fonts, ThemeProvider
│   ├── page.tsx                # Home/dashboard page
│   ├── globals.css             # Global styles + Tailwind + CSS variables
│   ├── login/                  # Login page
│   ├── signup/                 # Registration page
│   ├── forgot-password/        # Password reset
│   ├── events/                 # Event management
│   ├── tasks/                  # Task management
│   ├── calendar/               # Calendar view
│   ├── vendors/                # Vendor management
│   ├── resources/              # Resource management
│   ├── participants/           # Participant dashboard
│   └── components/             # Page-level shared components
│
├── components/                 # Shared components
│   ├── ThemeToggle.tsx         # Dark/light mode switch
│   └── ui/                     # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── toast.tsx
│
└── lib/                        # API clients and utilities
    ├── auth-api.ts             # Login/signup API calls
    ├── auth-session.ts         # JWT token storage (localStorage)
    ├── event-api.ts            # Event API client
    ├── task-api.ts             # Task API client
    ├── calendar-api.ts         # Calendar API client
    ├── checkin-api.ts          # Check-in API client
    ├── vendor-api.ts           # Vendor API client
    ├── resource-api.ts         # Resource API client
    ├── scheduling-api.ts       # Scheduling API client
    ├── budget-api.ts           # Budget API client
    ├── theme-provider.tsx      # Dark mode context provider
    ├── utils.ts                # cn() utility for Tailwind class merging
    └── validations/
        └── auth.ts             # Zod schemas for login/signup forms
```

**Note**: Frontend has no `src/` subdirectory — `app/`, `components/`, and `lib/` are direct children of `frontend/`.

## Feature Modules (`apps/`)

All 11 modules follow the same internal structure:

```
apps/<module>/
├── package.json
├── vitest.config.js            # If tests exist
└── src/
    ├── index.js                # Plugin entry — exports init(app, registry)
    ├── controller/
    │   └── <module>.controller.js
    ├── routes/
    │   └── <module>.routes.js
    ├── schema/
    │   └── <module>.schema.js  # Validation (auth, event) or Mongoose model
    └── service/
        ├── <module>.service.js
        └── <module>.service.test.js  # If tests exist
```

### Module Inventory

| Module | Directory | Storage | Description |
|--------|-----------|---------|-------------|
| Auth | `apps/auth/` | MongoDB | User registration, login, JWT tokens |
| Club | `apps/club/` | In-memory | Club management, membership |
| Institute | `apps/institute/` | In-memory | Institute management |
| Event | `apps/event/` | In-memory | Event CRUD, RSVP/registration |
| Check-in | `apps/checkin/` | In-memory | QR code check-in, attendance |
| Task | `apps/task/` | In-memory | Task assignment and tracking |
| Calendar | `apps/calendar/` | In-memory | Calendar event management |
| Vendor | `apps/vendor/` | MongoDB | Vendor management and rating |
| Resource | `apps/resource/` | MongoDB | Equipment and resource tracking |
| Scheduling | `apps/scheduling/` | MongoDB | Time slot scheduling, conflicts |
| Budget | `apps/budget/` | MongoDB | Budget allocation, expenses |

> **Important**: MongoDB is required to start the server — `connectDB()` runs at boot and exits on failure.
> Some modules (Club, Institute, Event, Check-in, Task, Calendar) store data in-memory using `Map()` objects, meaning their data is lost on restart.
> Operations layer modules (Phase 5) use MongoDB with Mongoose.
> See [MongoDB Migration](../backend/MONGODB_MIGRATION.md) for the plan to migrate all modules to MongoDB.

## Shared Package (`shared/`)

```
shared/
├── package.json                # @campus-os/shared
└── src/
    └── index.js                # Currently minimal — placeholder for shared utilities
```

## Key Dependencies

### Root (`package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `mongoose` | ^9.6.1 | MongoDB ODM (shared across modules) |
| `mongodb-memory-server` | ^11.1.0 | In-memory MongoDB for tests |
| `eslint` | ^10.3.0 | Linting |
| `prettier` | ^3.8.3 | Formatting |

### Backend (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | HTTP framework (v5!) |
| `cors` | ^2.8.6 | Cross-origin requests |
| `jsonwebtoken` | ^9.0.3 | JWT signing/verification |
| `joi` | ^18.1.2 | Validation (available but not universally used) |
| `dotenv` | ^17.4.0 | Environment variable loading |

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.2 | React framework |
| `react` | 19.2.4 | UI library |
| `tailwindcss` | ^4 | Utility-first CSS |
| `shadcn` | ^4.6.0 | Component library |
| `react-hook-form` | ^7.75.0 | Form state |
| `zod` | ^3.23.8 | Schema validation |
| `axios` | ^1.14.0 | HTTP client (available, but API clients use `fetch`) |

---

**See Also**: [Architecture Overview](../architecture/OVERVIEW.md) · [Plugin System](../architecture/PLUGIN_SYSTEM.md) · [Backend Architecture](../architecture/BACKEND.md)

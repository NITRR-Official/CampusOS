# CampusOS Project Structure

How the repository is organized, verified against the filesystem.

## Root Directory

```
CampusOS/
├── plugins/                       # Feature modules (plugins)
├── backend/                    # Express core server
├── frontend/                   # Next.js web application
├── shared/                     # Shared utilities package
├── docs/                       # Documentation
├── .github/                    # CI workflows, issue templates
│
├── package.json                # Root — pnpm workspaces, shared deps
├── pnpm-workspace.yaml         # Workspace config (authoritative)
├── pnpm-lock.yaml              # Lock file
├── README.md                   # Project gateway
├── COPILOT.md                  # AI development rules
├── LICENSE                     # MIT License
├── eslint.config.js            # Shared ESLint config
├── .prettierrc                 # Prettier config
└── .gitignore
```

### Workspace Configuration

Workspaces are defined in `pnpm-workspace.yaml`:

```yaml
packages:
  - backend
  - frontend
  - plugins/*
  - shared
```

## Backend (`backend/`)

```
backend/
├── package.json                # @campus-os/backend — Express 5.2, JWT, CORS
└── src/
    ├── index.js                # Entry point — connectDB → createApp → startServer
    ├── app.js                  # Express app — middleware chain + plugin loading
    ├── server.js               # HTTP server — graceful shutdown, signal handling
    ├── plugin-loader.js        # Scans /plugins/ for plugin.js or src/index.js
    │
    ├── auth/
    │   └── jwt-authenticator.js  # JWT sign/verify — registered as authenticator
    │
    ├── middleware/
    │   ├── auth.js             # JWT verification, public route allowlist
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
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Global styles + Tailwind + CSS variables
│   ├── (auth)/                 # Public auth routes
│   │   ├── login/              # Login page
│   │   ├── signup/             # Registration page
│   │   └── forgot-password/    # Password reset
│   ├── (dashboard)/            # Protected app routes
│   │   ├── layout.tsx          # Dashboard layout (sidebar, header)
│   │   ├── admin/              # Super-admin routes
│   │   ├── events/             # Event management
│   │   ├── tasks/              # Task management
│   │   ├── calendar/           # Calendar view
│   │   ├── clubs/              # Club management
│   │   ├── vendors/            # Vendor management
│   │   ├── resources/          # Resource management
│   │   └── participants/       # Participant dashboard
│   ├── components/             # Page-level shared components
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
├── lib/                        # Global API clients and utilities
│   ├── api/                    # Core API layer
│   │   └── client.ts           # Unified Zod-validated API client
│   ├── theme-provider.tsx      # Dark mode context provider
│   └── utils.ts                # cn() utility for Tailwind class merging
```

**Note**: Frontend has no `src/` subdirectory — `app/`, `components/`, and `lib/` are direct children of `frontend/`. Plugin-specific frontend code (like API hooks and components) lives in `plugins/<module>/frontend/`.

## Feature Modules (`plugins/`)

All 11 modules follow the same internal structure:

```
plugins/<module>/
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

| Module     | Directory             | Storage | Description                          |
| ---------- | --------------------- | ------- | ------------------------------------ |
| Auth       | `plugins/auth/`       | MongoDB | User registration, login, JWT tokens |
| Club       | `plugins/club/`       | MongoDB | Club management, membership          |
| Institute  | `plugins/institute/`  | MongoDB | Institute management                 |
| Event      | `plugins/event/`      | MongoDB | Event CRUD, RSVP/registration        |
| Check-in   | `plugins/checkin/`    | MongoDB | QR code check-in, attendance         |
| Task       | `plugins/task/`       | MongoDB | Task assignment and tracking         |
| Calendar   | `plugins/calendar/`   | MongoDB | Calendar event management            |
| Vendor     | `plugins/vendor/`     | MongoDB | Vendor management and rating         |
| Resource   | `plugins/resource/`   | MongoDB | Equipment and resource tracking      |
| Scheduling | `plugins/scheduling/` | MongoDB | Time slot scheduling, conflicts      |
| Budget     | `plugins/budget/`     | MongoDB | Budget allocation, expenses          |

> [!NOTE]
> MongoDB is required to start the server — `connectDB()` runs at boot and exits on failure.
> All plugins now natively store data in MongoDB via Mongoose. The legacy in-memory Map implementations have been fully deprecated.

## Shared Package (`shared/`)

```
shared/
├── package.json                # @campus-os/shared
└── src/
    └── index.js                # Currently minimal — placeholder for shared utilities
```

## Key Dependencies

### Root (`package.json`)

| Package                 | Version | Purpose                             |
| ----------------------- | ------- | ----------------------------------- |
| `mongoose`              | ^9.6.1  | MongoDB ODM (shared across modules) |
| `mongodb-memory-server` | ^11.1.0 | In-memory MongoDB for tests         |
| `eslint`                | ^10.3.0 | Linting                             |
| `prettier`              | ^3.8.3  | Formatting                          |

### Backend (`backend/package.json`)

| Package        | Version | Purpose                                         |
| -------------- | ------- | ----------------------------------------------- |
| `express`      | ^5.2.1  | HTTP framework (v5!)                            |
| `cors`         | ^2.8.6  | Cross-origin requests                           |
| `jsonwebtoken` | ^9.0.3  | JWT signing/verification                        |
| `joi`          | ^18.1.2 | Validation (available but not universally used) |
| `dotenv`       | ^17.4.0 | Environment variable loading                    |

### Frontend (`frontend/package.json`)

| Package           | Version | Purpose                                              |
| ----------------- | ------- | ---------------------------------------------------- |
| `next`            | 16.2.2  | React framework                                      |
| `react`           | 19.2.4  | UI library                                           |
| `tailwindcss`     | ^4      | Utility-first CSS                                    |
| `shadcn`          | ^4.6.0  | Component library                                    |
| `react-hook-form` | ^7.75.0 | Form state                                           |
| `zod`             | ^3.23.8 | Schema validation                                    |
| `axios`           | ^1.14.0 | HTTP client (available, but API clients use `fetch`) |

---

**See Also**: [Architecture Overview](../architecture/OVERVIEW.md) · [Plugin System](../architecture/PLUGIN_SYSTEM.md) · [Backend Architecture](../architecture/BACKEND.md)

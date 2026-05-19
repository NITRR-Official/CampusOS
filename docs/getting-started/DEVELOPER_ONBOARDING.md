# Developer Onboarding

Everything you need to go from zero to your first merged PR.

## 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/NITRR-Official/CampusOS.git
cd CampusOS

# Verify versions
node --version    # Must be 18.0.0+
pnpm --version    # Must be 10.0.0+

# Install all dependencies (pnpm workspaces)
pnpm install
```

## 2. Start MongoDB

The backend requires MongoDB. Easiest way is Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

See [Database Setup](./DATABASE_SETUP.md) for other methods.

## 3. Start the Servers

```bash
# Terminal 1: Backend (Express on port 4000)
cd backend && pnpm dev

# Terminal 2: Frontend (Next.js on port 3000)
cd frontend && pnpm dev
```

You should see:

```
🚀 CampusOS Backend running on http://localhost:4000
📝 Environment: development
✅ MongoDB connected successfully
```

## 4. Project Structure

Here's what actually exists in the repo:

```
CampusOS/
├── apps/                   # Feature modules (plugins)
│   ├── auth/              #   User registration, login, JWT
│   ├── club/              #   Club management
│   ├── institute/         #   Institute management
│   ├── event/             #   Event CRUD
│   ├── checkin/           #   QR check-in
│   ├── task/              #   Task assignment
│   ├── calendar/          #   Calendar management
│   ├── vendor/            #   Vendor management
│   ├── resource/          #   Resource allocation
│   ├── scheduling/        #   Time slot scheduling
│   └── budget/            #   Budget tracking
│
├── backend/src/            # Express server core
│   ├── index.js           #   Entry point
│   ├── app.js             #   Middleware + plugin loading
│   ├── server.js          #   HTTP server
│   ├── plugin-loader.js   #   Scans /apps/ at startup
│   ├── auth/              #   JWT authenticator
│   ├── middleware/         #   auth, error, logger, permissions
│   ├── database/          #   MongoDB connection + schemas
│   └── utils/registry.js  #   Service registry (module communication)
│
├── frontend/               # Next.js 16 application
│   ├── app/               #   Pages (App Router)
│   ├── components/        #   ThemeToggle + shadcn/ui components
│   └── lib/               #   API clients, auth session, theme provider
│
├── docs/                   # Documentation (you are here)
└── .github/                # CI/CD, issue templates, agent configs
```

## 5. Make Your First Contribution

### Find an issue

Look for [`good-first-issue`](https://github.com/NITRR-Official/CampusOS/issues?q=label%3Agood-first-issue) on GitHub.

### Create a branch

```bash
git checkout -b feature/<issue-number>-<short-description>
# Example: git checkout -b feature/42-add-vendor-search
```

### Make changes

- **Backend feature?** → Add/modify a module in `apps/<module>/`
- **Frontend page?** → Add pages in `frontend/app/`
- **Both?** → Build vertically: schema → service → controller → routes → frontend

### Run quality checks

```bash
pnpm lint          # ESLint
pnpm build         # Build check
```

### Commit and push

```bash
git add .
git commit -m "feat(vendor): add vendor search by category"
git push origin feature/42-add-vendor-search
```

Then create a Pull Request on GitHub.

## 6. Key Commands

```bash
# Development
cd backend && pnpm dev       # Backend (port 4000)
cd frontend && pnpm dev      # Frontend (port 3000)

# Quality
pnpm lint                    # Lint all packages
pnpm build                   # Build all packages

# Testing
pnpm -C apps/vendor test     # Run vendor module tests
pnpm -C apps/budget test     # Run budget module tests

# Check MongoDB
docker start mongodb         # Restart MongoDB
docker logs mongodb          # Check MongoDB logs
```

## 7. How Things Connect

```
Frontend (port 3000)
    │
    │  fetch('/api/v1/vendors')
    │  Authorization: Bearer <token>
    │
    ▼
Backend (port 4000)
    │
    ├── middleware/auth.js     → Verifies JWT
    ├── middleware/permissions  → Checks role
    ├── apps/vendor/routes     → Matches route
    ├── apps/vendor/controller → Extracts params, calls service
    └── apps/vendor/service    → Business logic → MongoDB
```

## 8. Common Issues

| Problem                            | Solution                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| `ECONNREFUSED` on backend start    | MongoDB isn't running → `docker start mongodb`                 |
| Port 3000/4000 already in use      | Kill the process or change `PORT` in `.env`                    |
| `pnpm: command not found`          | `npm install -g pnpm`                                          |
| Backend starts but no plugins load | Check `apps/` directory exists and modules have `src/index.js` |
| Frontend builds but API calls fail | Backend must be running, check `NEXT_PUBLIC_API_BASE_URL`      |
| MongoDB download timeout in tests  | Increase `beforeAll` timeout to `120000`                       |

## 9. Where to Go Next

- [Architecture Overview](../architecture/OVERVIEW.md) — How the system is designed
- [Plugin System](../architecture/PLUGIN_SYSTEM.md) — How to create a new module
- [API Standards](../guides/API_STANDARDS.md) — REST conventions used here
- [Git Workflow](../guides/GIT_WORKFLOW.md) — Branching and PR process
- [Testing Guide](../guides/TESTING.md) — How to write tests

---

**See Also**: [Quick Start](./QUICK_START.md) · [Project Structure](../project/PROJECT_STRUCTURE.md) · [Contributing](../contributing/CONTRIBUTING.md)

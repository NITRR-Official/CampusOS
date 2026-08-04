---
name: developer-onboarding
description: "Get started with CampusOS development. Use when setting up the local environment, making a first contribution, troubleshooting setup issues, or understanding project structure."
---

# Developer Onboarding

## When to Use

- First-time setup on a new machine
- Contributing to CampusOS for the first time
- Environment issues or dependency problems
- Understanding architecture and module organization

## Procedure

### 1. Environment Setup

```bash
git clone https://github.com/NITRR-Official/CampusOS.git
cd CampusOS

# Check versions (Node 18+, pnpm 8+)
node --version
pnpm --version

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with required values (MONGODB_URI, JWT_SECRET)
```

### 2. Start Development

```bash
# 1. Start MongoDB (required)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 2. Start all services
pnpm dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:4000
# Health:   http://localhost:4000/health
```

### 3. Project Structure

```
CampusOS/
├── frontend/           # Next.js 16 (App Router, React 19, TypeScript)
│   ├── app/            # Pages & layouts
│   ├── components/     # Shared + shadcn/ui components
│   └── lib/            # API clients, utilities, validations
├── backend/            # Express v5 server
│   └── src/
│       ├── middleware/  # Auth, RBAC, logger, error handler
│       ├── database/   # Mongoose connection + schemas
│       └── utils/      # Service registry
├── plugins/               # Plugin modules
│   ├── auth/           # Authentication
│   ├── club/           # Club management
│   ├── event/          # Event management
│   ├── vendor/         # Vendor management
│   ├── resource/       # Resource management
│   ├── scheduling/     # Scheduling
│   └── budget/         # Budget management
└── docs/               # Documentation (source of truth)
```

### 4. First Contribution

```bash
git checkout -b feature/<issue>-<description>

# Make changes following docs/contributing/CODING_GUIDELINES.md

# Run checks
pnpm lint
pnpm -C plugins/<module> test -- --run

# Commit with Conventional Commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/<issue>-<description>
gh pr create --fill
```

### 5. Key Rules

- **pnpm only** — never npm or yarn
- **ES Modules** — `import`/`export`, never `require()`
- **Backend port**: 4000 (not 3000)
- **All data**: MongoDB/Mongoose (no in-memory storage)
- **Testing**: Vitest with mongodb-memory-server

## Quick Reference

```bash
pnpm dev              # Start everything
pnpm lint             # Code quality
pnpm -C plugins/vendor test -- --run  # Run tests
pnpm build            # Build all
```

## Common Issues

| Issue | Solution |
|-------|----------|
| pnpm not found | `npm install -g pnpm@8` |
| Port in use | Check for existing processes on 3000/4000 |
| DB connection fails | `docker start mongodb` — check MONGODB_URI |
| Module not found | Run `pnpm install` from root |

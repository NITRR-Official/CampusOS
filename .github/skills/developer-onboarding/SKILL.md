---
name: developer-onboarding
description: 'Get started with CampusOS development. Use when: setting up local environment, making your first contribution, troubleshooting setup issues, understanding project structure.'
---

# Developer Onboarding

## When to Use

- First-time setup on new machine
- Contributing to CampusOS for first time
- Environment issues or dependency problems
- Understanding architecture and module organization
- Submitting first pull request

## Procedure

### 1. Environment Setup

Clone and install:

```bash
# Clone repository
git clone https://github.com/NITRR-Official/CampusOS.git
cd CampusOS

# Check versions (Node 18.17+, pnpm 8.0+)
node --version
pnpm --version

# Install pnpm globally if needed
npm install -g pnpm@8

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Ask maintainer for secret values: DATABASE_URL, JWT_SECRET, etc.
```

### 2. Local Development Setup
  
Start the database and servers:

```bash
# 1. Start MongoDB (Required)
# The backend will fail to start without a running MongoDB instance.
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 2. Start all (frontend + backend concurrent)
pnpm dev

# Verify: http://localhost:3000 (frontend)
#         http://localhost:4000 (backend API)
```

### 3. Project Structure Understanding

Navigate key directories:

```
CampusOS/
├── src/                # Frontend (Next.js)
│   ├── app/           # Pages & layout
│   ├── components/    # React components
│   ├── lib/          # Utilities
│   ├── stores/       # Zustand state
│   └── styles/       # CSS & Tailwind
├── backend/          # Express server
│   ├── src/api/      # Route handlers
│   ├── middleware/   # Express middleware
│   ├── models/       # DB models
│   └── services/     # Business logic
├── apps/             # Plugin modules (foundation, execution, etc.)
├── .github/
│   ├── skills/       # Development skills
│   └── workflows/    # CI/CD
└── .humanet/         # Architecture decisions
```

### 4. First Contribution Workflow

Make your first change:

```bash
# 1. Find "good-first-issue" on GitHub

# 2. Create branch
git checkout -b feature/123-your-task

# 3. Make changes

# 4. Run tests locally
pnpm test
pnpm lint
pnpm type-check

# 5. Commit with standards
git commit -m "feat: add new feature"

# 6. Push and create PR
git push origin feature/123-your-task
gh pr create
```

### 5. Common Daily Commands

Everyday workflows:

```bash
# Frontend only
pnpm dev:client       # Just Next.js (port 3000)

# Backend only
pnpm dev:server       # Just Express (port 3001)

# Tests
pnpm test            # Run all
pnpm test:watch      # Watch mode
pnpm test:coverage   # Coverage report

# Code quality
pnpm lint --fix      # Auto-fix linting
pnpm type-check      # TypeScript
pnpm format          # Code formatting

# Database
# Note: MongoDB handles schemas dynamically. No migration commands needed!
```

### 6. Troubleshooting Common Issues

Resolve setup problems:

```bash
# Port 3000/3001 in use
PORT=3002 pnpm dev
# Or kill: lsof -ti:3000 | xargs kill -9

# Database connection fails
# Ensure MongoDB is running (e.g., docker start mongodb)
# Check .env.local MONGODB_URI

# Dependency conflicts
pnpm install --force
pnpm store prune      # Clear cache

# Module not found
pnpm install
pnpm generate:types

# Tests failing locally
rm -rf node_modules && pnpm install
node --version  # Match CI version
```

## Quick Reference

```bash
# One-time setup
git clone ... && cd CampusOS && pnpm install && cp .env.example .env.local

# Daily
pnpm dev              # Start everything
pnpm test             # Tests
pnpm lint             # Quality

# Before push
pnpm test && pnpm lint && pnpm type-check && pnpm build

# New feature
git checkout -b feature/<issue>-<desc>
# ... make changes ...
git push origin feature/<issue>-<desc>
gh pr create --fill
```

## Common Issues

| Issue                  | Solution                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| pnpm not found         | Install: `npm install -g pnpm@8`                                          |
| Port in use            | Kill: `lsof -ti:3000 \| xargs kill -9`                                    |
| .env.local not working | Copy: `cp .env.example .env.local`. Ask maintainer for secrets.           |
| DB connection fails    | Check MongoDB is running (`docker start mongodb`). Verify `MONGODB_URI`.  |
| TypeScript errors      | Run `pnpm type-check`. Restart VS Code.                                   |
| Tests fail             | Clear: `pnpm install`. Regen types: `pnpm generate:types`.                |
| Can't push branch      | Fetch: `git fetch origin`. Try: `git push --set-upstream origin <branch>` |
| pnpm install slow      | Check internet. Run `pnpm store prune`.                                   |

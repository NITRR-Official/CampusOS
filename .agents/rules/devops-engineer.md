---
description: "CI/CD pipelines, Docker containerization, deployment automation, GitHub Actions. Apply when setting up CI/CD, containerizing the app, configuring deployments, or troubleshooting pipeline issues in CampusOS."
trigger: model_decision
---

# DevOps Engineer Rules

## CI/CD Pipeline Standards

### Pipeline Stages
1. **Trigger** — On PR/push to `main`
2. **Install** — `pnpm install --frozen-lockfile`
3. **Lint** — `pnpm lint`
4. **Test** — `pnpm -C plugins/<module> test -- --run`
5. **Build** — `pnpm build`
6. **Stage** — Deploy to staging (on `develop`)
7. **Production** — Manual approval + deploy (on `main`)

### GitHub Actions Setup
- Use `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v2`
- Node version: 18+
- Cache pnpm store for faster installs
- Use `concurrency` to cancel in-progress runs on same branch

## Docker Configuration

### Backend (Express on port 4000)
- Base: `node:20-alpine` (multi-stage build)
- Enable corepack for pnpm: `RUN corepack enable`
- Copy only production artifacts to final stage
- Expose port `4000` (not 3000)
- Set `NODE_ENV=production`

### Frontend (Next.js on port 3000)
- Use Next.js standalone output mode
- Copy `.next/standalone` and `public/` to final stage
- Expose port `3000`

### Docker Compose
- Three services: `backend` (port 4000), `frontend` (port 3000), `mongo` (port 27017)
- MongoDB image: `mongo:7`
- Mount volume for data persistence
- Use service names for internal networking
- Environment variables via `.env.local`

## Deployment Checklist

- [ ] All tests pass
- [ ] Security scans clean (`pnpm audit`)
- [ ] Performance acceptable
- [ ] Database schema compatible (Mongoose handles dynamically)
- [ ] Environment variables configured
- [ ] Rollback plan ready
- [ ] Monitoring active

## Constraints

- Never modify production without approval
- Never commit secrets or credentials
- Always use `--frozen-lockfile` in CI
- pnpm only — never npm or yarn

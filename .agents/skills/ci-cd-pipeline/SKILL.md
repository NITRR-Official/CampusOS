---
name: ci-cd-pipeline
description: "GitHub Actions workflows, testing automation, deployment triggers for CampusOS. Use when setting up CI/CD, automating tests, configuring deployments, or managing workflow triggers."
---

# CI/CD Pipeline

## When to Use

- Setting up automated testing on pull requests
- Configuring deployment workflows
- Implementing branch protection rules
- Caching build artifacts

## Procedure

### Phase 1: Workflow Configuration

Create `.github/workflows/ci.yml`:
```yaml
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
```

### Phase 2: Node.js & pnpm Setup

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v2
  - uses: actions/setup-node@v4
    with:
      node-version: 18
      cache: 'pnpm'
  - run: pnpm install --frozen-lockfile
```

### Phase 3: Testing Automation

```yaml
  - run: pnpm lint
  - run: pnpm -C apps/vendor test -- --run
  - run: pnpm -C apps/resource test -- --run
  - run: pnpm -C apps/scheduling test -- --run
  - run: pnpm -C apps/budget test -- --run
```

Note: CampusOS uses **Vitest** (not Jest). Each module has its own `vitest.config.js`.

### Phase 4: Build

```yaml
  - run: pnpm build          # Backend build
  - run: cd frontend && pnpm build  # Frontend build (Next.js)
```

### Phase 5: Deployment Triggers

- Staging: Deploy on push to `develop`
- Production: Manual approval + deploy on merge to `main`
- Use `environment: production` for approval gates

## Quick Reference

```bash
# Run the same checks CI runs
pnpm install --frozen-lockfile
pnpm lint
pnpm -C apps/vendor test -- --run
pnpm build

# Validate workflow syntax locally
act -j test_job
```

## Common Issues

| Issue | Solution |
|-------|----------|
| pnpm cache not working | Use `actions/setup-node@v4` with `cache: 'pnpm'` |
| Tests fail in CI, pass locally | Use `--frozen-lockfile`; check env vars |
| Node version mismatch | Pin to Node 18 in workflow |

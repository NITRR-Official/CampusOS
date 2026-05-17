---
name: ci-cd-pipeline
description: 'GitHub Actions workflows, testing automation, deployment triggers. Use when: setting up CI/CD, automating tests, configuring deployments, managing workflow triggers, caching dependencies.'
argument-hint: 'trigger-event, branches, test-suite'
---

# CI/CD Pipeline

## When to Use

- Setting up automated testing on pull requests
- Configuring deployment workflows
- Implementing branch protection rules
- Automating dependency updates
- Caching build artifacts
- Managing workflow triggers and conditions

## What This Skill Does

Establishes GitHub Actions CI/CD workflows for CampusOS, automating linting, testing, builds, and deployments on specific branches and PR events.

## Procedure

### Phase 1: Workflow Configuration

1. Create `.github/workflows/` directory structure
2. Define workflow file: `ci-test.yml`, `deploy.yml`, `lint.yml`
3. Set triggers:
   - `push: {branches: [main]}`
   - `pull_request: {branches: [main]}`
   - `schedule: {cron: '0 2 * * *'}` (nightly)
4. Use `on:` syntax for multiple triggers:
   ```yaml
   on:
     push: { branches: [main, develop] }
     pull_request: { branches: [main] }
   ```
5. Add environment variables at workflow level
6. Specify job concurrency and runner: `runs-on: ubuntu-latest`

### Phase 2: Node.js & pnpm Setup

1. Checkout code: `actions/checkout@v4`
2. Install Node.js: `actions/setup-node@v4`
3. Enable pnpm: `pnpm/action-setup@v2`
4. Install dependencies: `pnpm install --frozen-lockfile`
5. Cache pnpm store: `pnpm store path` → actions/cache
6. Cache node_modules: `.pnpm-store`

### Phase 3: Testing Automation

1. Run linter: `pnpm lint`
2. Run unit tests: `pnpm test`
3. Generate coverage: `pnpm test --coverage`
4. Upload coverage to Codecov/Coveralls
5. Fail job if coverage drops below threshold (80%)
6. Run integration tests: `pnpm test:integration`

### Phase 4: Build & Artifact Management

1. Build backend: `pnpm build`
2. Build frontend (Next.js): `pnpm build:web`
3. Upload build artifacts for deploy jobs
4. Store build logs on failure
5. Verify build output size (warn if >5MB)
6. Tag build with commit SHA/timestamp

### Phase 5: Deployment Triggers

1. Set deployment step to run only on `main` branch
2. Add approval requirement: `environment: production`
3. Deploy to staging on `develop` branch
4. Deploy to production after merge to main
5. Include rollback strategy (revert previous image)
6. Require successful tests before deploy

### Phase 6: Notifications & Status

1. Report status to PR commits
2. Send Slack notifications on failure
3. Add GitHub status checks (required on PR)
4. Comment PR with test results + coverage
5. Create issue on repeated failures
6. Log workflow duration and costs

## Quick Reference

```bash
# Create workflow skeleton
touch .github/workflows/ci-test.yml

# Validate workflow syntax
pnpm exec github-actions-linter .github/workflows/*.yml

# Run tests locally same as CI
pnpm install --frozen-lockfile
pnpm lint && pnpm test

# Debug failed workflow locally
act -j test_job

# View GitHub workflow logs
gh run list --repo owner/campus-os
gh run view {RUN_ID} --log

# Trigger workflow manually
gh workflow run ci-test.yml --ref main
```

## Troubleshooting

| Issue                           | Solution                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| pnpm cache not working          | Remove `pnpm/action-setup@v2` line; use built-in node caching             |
| Tests fail in CI, pass locally  | Run `pnpm install --frozen-lockfile` locally; check env vars              |
| Deployment job skipped          | Add `if: github.ref == 'refs/heads/main'` condition                       |
| Workflow file not recognized    | Ensure YAML syntax valid; check `.github/workflows/` path                 |
| Concurrent jobs blocking        | Use `concurrency: {group: '${{ github.ref }}', cancel-in-progress: true}` |
| Node modules too large to cache | Use `--production` flag; exclude devDependencies from build               |

# Git Workflow

Branching, committing, and PR conventions for CampusOS.

## Branch Strategy

CampusOS uses two long-lived branches:

| Branch | Purpose                             | Protected                |
| ------ | ----------------------------------- | ------------------------ |
| `main` | Production-ready, stable code       | Yes — admin-only merges  |
| `dev`  | Active development, latest features | Yes — requires CI checks |

All feature work targets the `dev` branch. Only admins promote `dev` → `main` for production releases.

## Branch Naming

Format: `<type>/<issue-number>-<short-description>`

```bash
# Feature
git checkout -b feature/123-enrollment-api

# Bug fix
git checkout -b fix/456-course-filter-crash

# Chore (deps, tooling)
git checkout -b chore/789-update-deps

# Docs
git checkout -b docs/101-add-api-guide

# Tests
git checkout -b test/202-vendor-service-tests
```

### Branch Types

| Type       | Purpose                   |
| ---------- | ------------------------- |
| `feature`  | New functionality         |
| `fix`      | Bug fixes                 |
| `chore`    | Maintenance, dependencies |
| `docs`     | Documentation changes     |
| `test`     | Adding or fixing tests    |
| `perf`     | Performance improvements  |
| `refactor` | Code restructuring        |

## Starting a New Branch

Always branch from the latest `dev`:

```bash
# Sync with upstream
git fetch upstream

# Create branch from dev
git checkout -b feature/123-enrollment-api upstream/dev
```

> [!IMPORTANT]
> Never branch from `main` for feature work. The `main` branch is only for production releases.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>
```

### Examples

```bash
# Good
git commit -m "feat(vendor): add vendor rating endpoint"
git commit -m "fix(auth): handle expired token gracefully"
git commit -m "docs: update API standards guide"
git commit -m "test(budget): add expense validation tests"

# Bad
git commit -m "fixed stuff"
git commit -m "update"
git commit -m "WIP"
```

### Rules

- **Type**: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`
- **Scope** (optional): Module name — `(vendor)`, `(auth)`, `(frontend)`
- **Subject**: Lowercase, imperative, no period at the end
- **Body**: Optional, explain _why_ not _what_

## Keeping Your Branch Updated

Use **rebase** (not merge) to keep a clean history:

```bash
git fetch upstream
git rebase upstream/dev

# If conflicts arise
git status                # Review conflicted files
# ... edit and resolve ...
git add .
git rebase --continue
```

## Pull Request Process

### 1. Push Your Branch

```bash
git push origin feature/123-enrollment-api
```

### 2. Create the PR

Open a PR on GitHub targeting the **`dev`** branch (not `main`):

```bash
gh pr create --base dev \
  --title "feat(vendor): add vendor rating endpoint" \
  --body "Adds POST /api/v1/vendors/:id/rate endpoint. Closes #123"
```

> [!CAUTION]
> Always set the base branch to `dev`. PRs to `main` from contributors will be rejected.

### 3. PR Checklist

Before requesting review, run these commands from the project root:

```bash
pnpm format          # Auto-fix formatting (required)
pnpm lint            # Check for lint errors
pnpm type-check      # TypeScript strictness
pnpm test            # Run test suites
pnpm build           # Ensure frontend compiles
```

> [!WARNING]
> **Always run `pnpm format` before pushing.** CI runs `pnpm format:check` and will reject your PR if code isn't Prettier-formatted.

- [ ] All 5 commands above pass
- [ ] No console errors in browser
- [ ] Docs updated if needed
- [ ] Branch is up to date with `dev`

### 4. What Happens After You Open a PR

1. **CI checks** run automatically (lint, type-check, format, test, build)
2. **First-time contributors**: Vercel asks a maintainer to authorize your fork's deployment (one-time per contributor)
3. **Vercel auto-deploys the frontend** to a unique preview URL
   - The frontend preview is connected to the **dev branch backend** (stable URL)
   - The **backend is NOT auto-deployed** on PRs — this saves resources
4. A maintainer reviews your code
5. **If your PR includes backend changes**:
   - Maintainer adds the **`full-preview`** label
   - Both backend and frontend are deployed as a **linked pair**
   - Both preview URLs are commented on your PR
   - Further commits **auto-redeploy** while the label is present
6. Address any feedback, push new commits — previews auto-update

### 5. Address Review Feedback

```bash
# Make changes based on feedback
git commit -m "refactor: address review feedback"
git push origin feature/123-enrollment-api
```

## Merging

### For Contributors (PRs to `dev`)

Maintainers will **squash merge** your PR for clean history.

### For Admins (`dev` → `main`)

When `dev` is stable and tested:

```bash
# Create a PR from dev to main via GitHub UI or CLI
gh pr create --base main --head dev \
  --title "release: promote dev to production"
```

After merge, the production deployment triggers automatically.

### Cleanup

```bash
# After your PR is merged, delete your feature branch
git push origin --delete feature/123-enrollment-api
git branch -d feature/123-enrollment-api

# Sync your local dev
git checkout dev
git pull upstream dev
```

## Common Issues

| Issue                   | Solution                                                    |
| ----------------------- | ----------------------------------------------------------- |
| Merge conflict          | Edit conflicted files, `git add .`, `git rebase --continue` |
| Committed to dev        | `git revert <hash>` — never force-push protected branches   |
| Large conflict          | Squash commits first: `git rebase -i upstream/dev`          |
| Need to reset           | `git reset --hard upstream/dev` (⚠️ loses local changes)    |
| Can't push              | `git push --set-upstream origin <branch>`                   |
| PR targets wrong branch | Edit the PR base branch on GitHub to `dev`                  |

---

**See Also**: [CI/CD Pipeline](./CI_CD.md) · [Contributing Guide](../contributing/CONTRIBUTING.md) · [Code Review](./CODE_REVIEW.md)

# Git Workflow

Branching, committing, and PR conventions for CampusOS.

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

| Type | Purpose |
|------|---------|
| `feature` | New functionality |
| `fix` | Bug fixes |
| `chore` | Maintenance, dependencies |
| `docs` | Documentation changes |
| `test` | Adding or fixing tests |
| `perf` | Performance improvements |
| `refactor` | Code restructuring |

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
- **Body**: Optional, explain *why* not *what*

## Keeping Your Branch Updated

Use **rebase** (not merge) to keep a clean history:

```bash
git fetch origin
git rebase origin/main

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

```bash
gh pr create --title "feat(vendor): add vendor rating endpoint" \
  --body "Adds POST /api/v1/vendors/:id/rate endpoint"
```

### 3. PR Checklist

Before requesting review:

- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] Lint passes: `pnpm lint`
- [ ] No console errors in browser
- [ ] Docs updated if needed
- [ ] Branch is up to date with `main`

### 4. Address Review Feedback

```bash
# Make changes based on feedback
git commit -m "refactor: address review feedback"
git push origin feature/123-enrollment-api
```

## Merging

Use **squash merge** for clean history:

```bash
# Via GitHub CLI
gh pr merge --squash 123

# Manual
git checkout main && git pull
git merge --squash feature/123-enrollment-api
git commit -m "feat(vendor): add vendor rating endpoint (#123)"
git push origin main

# Cleanup
git push origin --delete feature/123-enrollment-api
git branch -d feature/123-enrollment-api
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Merge conflict | Edit conflicted files, `git add .`, `git rebase --continue` |
| Committed to main | `git revert <hash>` — never force-push main |
| Large conflict | Squash commits first: `git rebase -i origin/main` |
| Need to reset | `git reset --hard origin/main` (⚠️ loses local changes) |
| Can't push | `git push --set-upstream origin <branch>` |

---

**See Also**: [Contributing Guide](../contributing/CONTRIBUTING.md) · [Code Review](./CODE_REVIEW.md)

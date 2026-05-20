---
name: git-workflow
description: "Follow CampusOS branching and PR process. Use when starting new work, creating pull requests, reviewing code, merging to main, or resolving merge conflicts."
---

# Git Workflow

## When to Use

- Starting a new feature or bug fix
- Creating a pull request
- Code review and merging
- Resolving merge conflicts

## Procedure

### 1. Branch Naming

`<type>/<issue>-<description>`

```bash
git checkout -b feature/123-enrollment-api
git checkout -b fix/456-login-crash
git checkout -b chore/789-update-deps
# Types: feature, fix, chore, docs, test, perf, refactor
```

### 2. Commit Messages

Conventional Commits: `<type>(<scope>): <subject>`

```bash
git commit -m "feat(api): add vendor assignment endpoint"
git commit -m "fix(auth): handle expired token gracefully"
git commit -m "docs: update API standards guide"
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`

### 3. Keep Branch Updated

```bash
git fetch origin
git rebase origin/main
# If conflicts: edit files → git add . → git rebase --continue
```

### 4. Create Pull Request

```bash
git push origin feature/123-task
gh pr create --title "feat: add enrollment" --body "Closes #123"

# PR Checklist:
# - [ ] pnpm lint passes
# - [ ] pnpm -C apps/<module> test -- --run passes
# - [ ] pnpm build succeeds
# - [ ] Docs updated if needed
```

### 5. Merge to Main

Squash merge for clean history:
```bash
gh pr merge --squash 123
# Auto-deletes feature branch
```

## Quick Reference

```bash
git checkout -b feature/<issue>-<desc>    # Create branch
git commit -m "type: message"              # Commit
git push origin feature/<issue>-<desc>    # Push
git fetch && git rebase origin/main        # Update
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Merge conflict | Edit conflicted files, `git add .`, `git rebase --continue` |
| Committed to main | `git revert <hash>` — never force-push main |
| Need to reset | `git reset --hard origin/main` (loses local changes) |

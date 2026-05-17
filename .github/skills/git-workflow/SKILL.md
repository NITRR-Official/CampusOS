---
name: git-workflow
description: 'Follow CampusOS branching and PR process. Use when: starting new work, creating pull requests, reviewing code, merging to main, resolving merge conflicts.'
---

# Git Workflow

## When to Use

- Starting a new feature or bug fix
- Creating a pull request
- Code review and merging
- Resolving conflicts
- Tracking work with issues

## Procedure

### 1. Branch Naming Convention

Create branches: `<type>/<issue-number>-<description>`

```bash
# Feature branch
git checkout -b feature/123-enrollment-api

# Bug fix
git checkout -b fix/456-course-filter-crash

# Chore
git checkout -b chore/789-update-deps

# Types: feature, fix, chore, docs, test, perf, refactor
```

### 2. Commit Message Standards

Use Conventional Commits:

```bash
# Good
git commit -m "feat: add enrollment API

- POST /api/courses/:id/enroll
- Validates eligibility
- Returns 201 with details"

# Bad
git commit -m "fixed stuff"
```

Format: `<type>(<scope>): <subject>`

- type: feat, fix, chore, docs, refactor, perf, test
- scope: optional, e.g. (api), (courses)
- subject: lowercase, no period, imperative

### 3. Keeping Branch Updated

Rebase instead of merge:

```bash
git fetch origin
git rebase origin/main

# If conflicts
git status            # Review conflicts
# ... edit files ...
git add .
git rebase --continue
```

### 4. Creating a Pull Request

```bash
git push origin feature/123-task
gh pr create --title "feat: add enrollment" \
  --body "Adds POST endpoint for enrollments"

# PR Checklist
- [ ] Tests pass locally: pnpm test
- [ ] Build succeeds: pnpm build
- [ ] No console errors
- [ ] Code reviewed
- [ ] Docs updated if needed
```

### 5. Code Review & Addressing Feedback

```bash
# Make changes
git commit -m "refactor: address review feedback"
git push origin feature/123-task

# Address interactive with fixup
git commit --fixup 3a7c8d9
git rebase -i origin/main
```

### 6. Merging to Main

Use squash merge for clean history:

```bash
# Ensure updated
git pull origin main --rebase

# Squash merge
gh pr merge --squash 123

# Manual
git checkout main && git pull
git merge --squash feature/123-task
git commit -m "feat: add enrollment API (#123)"
git push origin main

# Cleanup
git push origin --delete feature/123-task
git branch -d feature/123-task
```

## Quick Reference

```bash
git checkout -b feature/<issue>-<desc>    # Create branch
git com mit -m "type: message"             # Commit
git push origin feature/<issue>-<desc>    # Push
git fetch && git rebase origin/main       # Update
git rebase -i HEAD~3                      # Squash commits
```

## Common Issues

| Issue             | Solution                                                      |
| ----------------- | ------------------------------------------------------------- |
| Merge conflict    | Edit conflicted files, `git add .`, continue rebase.          |
| Committed to main | Use `git revert <hash>`. Never force-push main.               |
| Large conflict    | `git rebase -i origin/main`, squash, retry.                   |
| Need to reset     | `git reset --hard origin/main`. Warning: loses local changes. |

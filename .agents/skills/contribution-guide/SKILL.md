---
name: contribution-guide
description: "Issues, labels, contributor workflow, pull request process for CampusOS. Use when onboarding contributors, documenting issue labels, setting up contribution guidelines, or managing PR workflow."
---

# Contribution Guide

## When to Use

- Onboarding new contributors
- Creating or updating contribution documentation
- Defining issue triage workflow
- Setting up PR review process

## Procedure

### Phase 1: Issue Labels

- **Type**: `type-bug`, `type-feature`, `type-documentation`, `type-question`
- **Priority**: `priority-critical`, `priority-high`, `priority-medium`, `priority-low`
- **Status**: `needs-review`, `blocked`, `in-progress`, `help-wanted`
- **Level**: `good-first-issue` (<2hr, self-contained), `intermediate`, `advanced`

### Phase 2: PR Process

1. Fork repository
2. Create branch: `<type>/<issue>-<description>` (e.g., `feature/123-add-login`)
3. Make changes following coding guidelines
4. Run checks locally:
   ```bash
   pnpm lint
   pnpm -C plugins/<module> test -- --run
   pnpm build
   ```
5. Commit with Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`
6. Push and create PR with template
7. Merge strategy: Squash merge to `main`

### Phase 3: Code Review

- Required: 1-2 approvals before merge
- Review criteria: code quality, test coverage (>80%), security, conventions
- Expected review time: <24 hours
- Use GitHub suggestions for easy fixes

### Phase 4: Contributor Levels

| Level | Criteria | Privileges |
|-------|----------|------------|
| Contributor | 1st PR | Listed in CONTRIBUTORS.md |
| Collaborator | 3+ quality PRs | Approve PRs, assign issues |
| Maintainer | Long-term | Merge, release management |

## Quick Reference

```bash
git checkout -b feature/<issue>-<desc>   # Create branch
pnpm lint && pnpm test                    # Run checks
git commit -m "feat: description"         # Conventional commit
gh pr create --fill                       # Create PR
```

See: `docs/contributing/CONTRIBUTING.md`, `docs/contributing/CODING_GUIDELINES.md`

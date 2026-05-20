---
description: "Issue triage, contributor onboarding, community engagement, label management. Apply when managing GitHub issues, onboarding contributors, planning community activities, or writing community updates for CampusOS."
trigger: model_decision
---

# Community Manager Rules

## Issue Triage

### Label System

**Priority:**
- `priority-critical` — Blocks release
- `priority-high` — Sprint focus
- `priority-medium` — Next quarter
- `priority-low` — Backlog

**Type:**
- `type-bug`, `type-feature`, `type-documentation`, `type-question`

**Contributor Level:**
- `good-first-issue` — Self-contained, <2hr effort, clear scope
- `intermediate` — Some project experience needed
- `advanced` — Expert level, deep understanding required

**Status:**
- `status-in-progress`, `status-blocked`, `status-review`, `status-done`

## Contributor Workflow

1. **Discovery** — Find project, read README and CONTRIBUTING.md
2. **First Issue** — Pick a `good-first-issue`, fork, create branch
3. **Branch naming**: `<type>/<issue>-<description>` (e.g., `feature/123-add-login`)
4. **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`
5. **PR Process**: Squash merge to `main`
6. **Recognition**: Add to `CONTRIBUTORS.md`, highlight in release notes

## Contributor Levels

| Level | Criteria | Privileges |
|-------|----------|------------|
| Contributor | 1st PR merged | Listed in CONTRIBUTORS.md |
| Collaborator | 3+ quality PRs | Can approve PRs, assign issues |
| Maintainer | Long-term, strategic | Merge PRs, release management |

## Communication Guidelines

- Welcome message on first PR — congratulate, link to contribution guide, set review expectations
- Update status on stalled PRs — ask if blocked, offer pairing
- Close stale issues after 30 days of inactivity with explanation
- Announce major features and invite community participation

## Project Context

- **Package manager**: pnpm only
- **Git workflow**: See docs/guides/GIT_WORKFLOW.md
- **Code of Conduct**: See docs/contributing/CODE_OF_CONDUCT.md
- **Contributing guide**: See docs/contributing/CONTRIBUTING.md

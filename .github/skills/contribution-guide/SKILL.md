---
name: contribution-guide
description: 'Issues, labels, contributor workflow, pull request process. Use when: onboarding contributors, documenting issue labels, setting up contribution guidelines, managing PR workflow.'
argument-hint: 'contributor-level, issue-type'
---

# Contribution Guide

## When to Use

- Preparing project for open-source contributions
- Creating contributor onboarding documentation
- Defining issue triage workflow
- Establishing PR review and merge criteria
- Setting up contributor rewards/recognition

## What This Skill Does

Establishes CampusOS contribution workflow including issue triage, PR process, labeling, and contributor guidelines.

## Procedure

### Phase 1: Issue Triage & Labels

1. Define label categories:
   - **Type**: bug, feature, enhancement, documentation
   - **Priority**: p0-critical, p1-high, p2-medium, p3-low
   - **Status**: needs-review, blocked, in-progress, help-wanted
   - **Area**: backend, frontend, database, infrastructure
2. Create labels in GitHub:
   ```
   good first issue - green - For new contributors
   help wanted - blue - Expertise needed
   needs-review - orange - Waiting on review
   ```
3. Triage incoming issues:
   - Add type label (bug, feature, etc.)
   - Set priority based on impact
   - Assignment: If clear owner, assign; else: help-wanted
   - Add area: backend, frontend, etc.
4. Label merge criteria:
   - `good-first-issue`: Self-contained, <2hr effort
   - `help-wanted`: Needs expertise, document approach
   - `blocked`: Waiting on other PR/issue, link dependency
5. Close stale issues after 30 days of inactivity
6. Review label usage monthly, consolidate if duplicates

### Phase 2: Pull Request Process

1. Document PR requirements in `CONTRIBUTING.md`:
   - Fork repository
   - Create feature branch: `git checkout -b feature/description`
   - Make changes, commit with clear message
   - Push and open PR with template
2. PR template (`.github/pull_request_template.md`):

   ```markdown
   ## Description

   Brief description of changes

   ## Fixes

   Closes #123

   ## Changes

   - [ ] Feature implemented
   - [ ] Tests added
   - [ ] Documentation updated

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   ```

3. Require PR checks:
   - Tests pass (CI/CD)
   - No lint errors
   - Minimum 1-2 approvals
   - Comments resolved
4. Set merge strategy: Squash commits for clean history
5. Require branch protection:
   - Require reviews before merge
   - Dismiss stale review on push
   - Require status checks pass
6. Auto-delete head branch after merge

### Phase 3: Code Review Workflow

1. Define review criteria:
   - Code quality (readable, maintainable)
   - Test coverage (>80%)
   - No security issues
   - Follows project conventions
   - Documentation complete (if API change)
2. Assign reviewers:
   - Backend changes: Backend maintainers
   - Frontend changes: Frontend maintainers
   - Multi-area: Multiple reviewers
3. Expected review time: <24 hours
4. Provide constructive feedback:
   - Request changes vs comment (clarity)
   - Suggest improvements (non-blocking)
   - Approve when satisfied
5. Use GitHub suggestions for easy fixes
6. Request additional info if unclear

### Phase 4: Contributor Levels & Responsibilities

1. **Contributors** (1st PR):
   - Fix documentation, typos
   - Complete small features
   - No need for contributor agreement
2. **Collaborators** (3+ quality PRs):
   - Approve PRs
   - Assign issues
   - Access to repository
3. **Maintainers** (long-term, strategic):
   - Merge PRs
   - Release management
   - Project roadmap
   - On-call for issues
4. Recognize contributors:
   - Add to `CONTRIBUTORS.md`
   - Badge in README for each PR
   - Highlight in release notes

### Phase 5: Issue Tracking & Automation

1. Use GitHub Projects for milestone tracking
2. Link issues to PRs: "Fixes #123" auto-closes
3. Automate with GitHub Actions:
   - Label stale issues after 30 days
   - Prompt for tests/docs on PR
   - Lock merged/resolved issues
4. Create issue templates for consistency:
   - Bug report (steps to reproduce)
   - Feature request (use case)
   - Documentation request
5. Set response time SLA:
   - Critical bugs: 4 hours
   - High priority: 1 day
   - Medium priority: 3 days
6. Monthly contributor showcase: Tweet top contributors

### Phase 6: Contributor Communication

1. Welcome message on first PR:
   - Congratulate on contribution
   - Link to contribution guide
   - Set expectations for review time
2. Update status on stalled PRs:
   - Ask for help if blocked
   - Extend deadline if needed
   - Offer pair-programming if stuck
3. Announce major features:
   - Link to contributing issues
   - Invite community to join effort
   - Celebrate completed work
4. Maintain contributor Slack/Discord channel
5. Monthly open office hours for questions
6. Annual contributor survey for feedback

## Quick Reference

```bash
# Create feature branch
git checkout -b feature/description

# View issue labels
gh label list

# Create new label
gh label create "good-first-issue" --color 00FF00

# View PRs by label
gh pr list --label help-wanted

# Link issue to PR
# In PR description: "Fixes #123"

# Add to contributors list
echo "- [@username](https://github.com/username) - Feature description" >> CONTRIBUTORS.md
```

## Troubleshooting

| Issue                                | Solution                                                            |
| ------------------------------------ | ------------------------------------------------------------------- |
| PR not receiving reviews             | Ping maintainers in Slack; consider labeling `needs-review`         |
| Contributor frustrated with feedback | Use kind language; offer pair programming; link to code style guide |
| Duplicate/related issues             | Link with "Related #123"; consolidate discussion                    |
| Merge conflict in PR                 | Rebase feature branch: `git rebase main feature/x`                  |
| Contributor becomes inactive         | Archive issue/PR; thank for effort; reopen if interest returns      |
| Too many stale issues                | Set GitHub automation to close after 60 days; request updates       |

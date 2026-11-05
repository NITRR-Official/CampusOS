---
name: issue-creator
description: "Generate properly formatted GitHub issues for CampusOS with appropriate sizing, labels, and metadata. Use when the user wants to create issues from testing or bug reports."
---

# Issue Creator

## When to Use

Use this skill when the user asks to create issues based on their manual testing, bug reports, or feature requests.

## Procedure

### Step 1: Determine Issue Sizing

Analyze the task provided by the user and determine the appropriate issue type:

1. **Epic Issue**: For large, complex tasks. This should act as a parent tracking issue and contain smaller, atomic sub-issues.
2. **Standard Issue**: For moderate-sized tasks that can be completed in a single PR.
3. **Good First Issue / Small Issue**: For very small, trivial tasks. You can merge multiple small tasks into one issue, or label a single small task as a `good first issue` for newcomers.

### Step 2: Extract Issue Metadata

Every issue generated MUST include the following metadata fields explicitly in its content so the user can copy-paste them:
- **Type**: (e.g., type:bug, type:feature, type:infra, type:security, type:docs)
- **Labels**: See the exact list below.
- **Relationship / Parent**: Parent epic or child issues (if any).
- **Blocking**: What other issues are blocked by this?
- **Blocked By**: What other issues block this?

### Step 3: Assign Valid Labels

Select accurate labels from this **exact allowed list ONLY**:
api, backend, blocked, calendar, cd, ci, ci-cd, contribution-drive, database, deployment, design, devops, difficulty:critical, difficulty:easy, difficulty:hard, difficulty:medium, docs, duplicate, enhancement, exceptional, figma, frontend, good first issue, help wanted, in-progress, invalid, needs-review, p0-critical, p1-high, p2-medium, p3-low, question, server, type:bug, type:docs, type:feature, type:infra, type:security, ui, ux, web, wontfix, workflow

### Step 4: Generate Issue Content

Generate the issue in Markdown format.

#### Example Epic Format
```markdown
# [Epic] High-Level Feature Name

**Type:** type:feature
**Labels:** backend, type:feature, p0-critical, difficulty:hard
**Parent:** None
**Blocking:** #22, #23
**Blocked By:** None

## Description
High-level description of the epic.

## Sub-issues
- [ ] Sub-issue 1 (to be created)
- [ ] Sub-issue 2 (to be created)
```

#### Example Standard Issue Format
```markdown
# [Bug] Specific Bug Name

**Type:** type:bug
**Labels:** backend, type:bug, api, p1-high, difficulty:medium
**Parent:** Child of Epic #21
**Blocking:** None
**Blocked By:** None

## Description
Detailed description of the bug, steps to reproduce, and expected behavior.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

## Output Format

Present the generated issue(s) clearly to the user in a Markdown fenced code block so they can easily copy and paste it into GitHub.

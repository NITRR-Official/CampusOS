---
name: commit-message-generator
description: "Generate commit titles and descriptions from uncommitted changes. Use when the user asks to generate a commit message, wants help writing a commit, or says 'commit', 'commit message', 'what should I commit', or similar."
---

# Commit Message Generator

## When to Use

- User asks for a commit message for their current changes
- User says "commit", "commit message", "generate commit", "what should I commit"
- User has uncommitted changes and needs a properly formatted commit message
- Before pushing code to the repository

## Procedure

### Step 1: Analyze Uncommitted Changes

Run these commands to understand what changed:

```bash
# See which files are modified, added, or deleted
git status --short

# See the full diff of staged AND unstaged changes
git diff HEAD

# If there are untracked files, list them
git ls-files --others --exclude-standard
```

### Step 2: Categorize Changes

Analyze the diff output and categorize changes into one of the Conventional Commit types:

| Type       | When to Use                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | New functionality, new endpoints, new components  |
| `fix`      | Bug fixes, error corrections                     |
| `docs`     | Documentation only changes                       |
| `test`     | Adding or updating tests                         |
| `chore`    | Dependencies, config, tooling, CI/CD             |
| `refactor` | Code restructuring without behavior change       |
| `perf`     | Performance improvements                         |
| `style`    | Formatting, whitespace, semicolons (not CSS)     |

### Step 3: Determine Scope

Identify the scope based on which part of the codebase was changed:

| Scope        | When to Use                                 |
| ------------ | ------------------------------------------- |
| `(frontend)` | Changes in `apps/frontend/` or `frontend/`  |
| `(backend)`  | Changes in `apps/backend/` or `backend/`    |
| `(api)`      | API endpoints, routes, controllers          |
| `(auth)`     | Authentication, authorization               |
| `(db)`       | Database schemas, models, migrations        |
| `(ui)`       | UI components, styling                      |
| `(ci)`       | CI/CD pipelines, GitHub Actions             |
| `(config)`   | Configuration files, environment setup      |
| _(omitted)_  | Changes span multiple modules or are global |

### Step 4: Generate Commit Message

#### Format

```
<type>(<scope>): <subject>

<body>
```

#### Rules for Subject Line

- **Lowercase**: Start with lowercase letter
- **Imperative mood**: "add feature" not "added feature" or "adds feature"
- **No period**: Don't end with a period
- **Max 72 chars**: Keep the subject line concise
- **Be specific**: "add vendor rating endpoint" not "update api"

#### Rules for Body (Description)

- Separate from subject with a blank line
- Explain **why** not **what** (the diff shows what)
- Wrap at 72 characters
- Use bullet points for multiple changes
- Reference issue numbers if applicable: `Closes #123`

### Step 5: Handle Multiple Logical Changes

If the uncommitted changes contain **multiple unrelated changes**, suggest splitting them into separate commits:

1. Identify distinct groups of changes
2. Generate a separate commit message for each group
3. Provide `git add` commands to stage each group separately:

```bash
# Commit 1: Feature changes
git add src/api/vendors/
git commit -m "feat(api): add vendor rating endpoint"

# Commit 2: Doc updates
git add docs/
git commit -m "docs: update API reference for vendor rating"
```

### Step 6: Present to User

Present the commit message(s) in a clean, copy-pasteable format:

```
feat(api): add vendor rating endpoint

Implement POST /api/v1/vendors/:id/rate to allow authenticated users
to submit ratings. Includes input validation and duplicate-vote guard.

Closes #123
```

If multiple commits are suggested, number them and provide the staging commands.

## Output Format

Always output:

1. **Summary of changes detected** — Brief overview of what files changed and what the changes do
2. **Recommended commit message(s)** — In a fenced code block, ready to copy
3. **Staging commands** (if splitting) — `git add` commands for each logical group

## Examples

### Single Commit

**Changes detected**: Modified `backend/src/routes/auth.ts` to fix token expiration handling.

```
fix(auth): handle expired refresh token gracefully

Return 401 with a clear error message instead of crashing when
the refresh token has expired. The client can now detect this
and redirect to the login page.
```

### Multiple Commits

**Changes detected**: Added new vendor endpoint + updated documentation + fixed lint config.

**Commit 1/3:**
```bash
git add backend/src/routes/vendors/
git commit -m "feat(api): add vendor assignment endpoint

Implement POST /api/v1/events/:id/vendors to assign vendors to events.
Includes RBAC check for organizer role.

Closes #45"
```

**Commit 2/3:**
```bash
git add docs/
git commit -m "docs: add vendor API reference"
```

**Commit 3/3:**
```bash
git add .eslintrc.js
git commit -m "chore(config): update eslint rules for new endpoint patterns"
```

## References

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- Project guidelines: `docs/contributing/CONTRIBUTING.md`
- Git workflow: `docs/guides/GIT_WORKFLOW.md`

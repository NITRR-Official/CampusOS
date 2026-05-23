---
name: pr-description-generator
description: "Generate PR titles and descriptions from commit history. Use when the user asks to generate a PR description, wants help writing a pull request, provides commit titles/messages, or says 'PR', 'pull request', 'PR description', or similar."
---

# PR Description Generator

## When to Use

- User asks for a PR title and description
- User provides commit titles/messages and wants a PR writeup
- User says "PR", "pull request", "generate PR", "PR description"
- Before creating a pull request on GitHub

## Procedure

### Step 1: Gather Commit Information

The user will provide commit titles and descriptions. If not provided, ask the user for them, or retrieve them from git:

```bash
# Get commits on current branch that are not on dev
git log --oneline upstream/dev..HEAD

# Get commits with full messages
git log --pretty=format:"%h %s%n%b%n---" upstream/dev..HEAD
```

### Step 2: Analyze All Commits

Group the commits by their type and scope to understand the overall PR:

1. **Identify the primary theme** — What is the main purpose of this set of commits?
2. **List all change categories** — `feat`, `fix`, `docs`, `chore`, etc.
3. **Identify affected scopes** — `(api)`, `(frontend)`, `(auth)`, etc.
4. **Find related issues** — Look for `Closes #N` or `#N` references

### Step 3: Generate PR Title

#### Format

```
<type>(<scope>): <concise summary of all changes>
```

#### Rules

- If all commits are the same type → use that type
- If mixed types with one dominant → use the dominant type
- If truly mixed → use the most impactful type (usually `feat` > `fix` > `refactor` > `chore` > `docs`)
- Keep under 72 characters
- Imperative mood, lowercase, no period
- The title should capture the **overall goal**, not list individual commits

#### Examples

| Commits | PR Title |
| ------- | -------- |
| `feat(api): add vendor endpoint` + `test(api): add vendor tests` + `docs: update api reference` | `feat(api): add vendor rating system` |
| `fix(auth): handle expired tokens` + `fix(auth): validate refresh token` | `fix(auth): improve token expiration handling` |
| `docs: update setup guide` + `docs: add api reference` + `chore: update readme` | `docs: consolidate developer documentation` |
| `feat(ci): add preview deployments` + `chore(config): add dynamic api url` + `docs: update ci guide` | `feat(ci): add automated preview deployments` |

### Step 4: Generate PR Description

Use the **exact template format** from `.github/pull_request_template.md`:

```markdown
## 📝 Description

<Write a clear, concise description of what this PR accomplishes.
Summarize the commits into a coherent narrative. Explain WHY these
changes were made, not just WHAT changed.>

## 🎯 Type of Change

- [x] <Check all applicable types based on the commits>
- [ ] 🐛 Bug fix (fixes an existing issue)
- [ ] ✨ New feature (adds new functionality)
- [ ] 🔄 Enhancement (improves existing functionality)
- [ ] 📖 Documentation update
- [ ] 🔧 Chore (dependency update, config change)
- [ ] 🎨 Style/formatting
- [ ] ♻️ Refactor (code restructuring without behavior change)

## 🔗 Related Issues

Closes #<issue numbers from commits, or "N/A">

## 📋 Checklist

- [x] I have read the [CONTRIBUTING.md](https://github.com/NITRR-Official/CampusOS/blob/main/CONTRIBUTING.md) guide
- [x] My code follows the project's code style
- [x] I have updated documentation if needed
- [x] I have added tests for new functionality
- [x] I have run `pnpm lint` and fixed any errors
- [x] I have run `pnpm build` successfully
- [x] My commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## 🧪 Testing

<Describe testing based on what the commits indicate.
Check applicable items:>

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing (describe scenarios)

## 🖼️ Screenshots

If applicable, add screenshots or GIFs demonstrating the changes.

## 🚀 Performance Impact

<Note any performance implications based on the changes, or "No performance impact expected.">

## 📚 Additional Context

<List the individual commits included in this PR:>

### Commits included:
- `<commit hash>` — <commit message>
- `<commit hash>` — <commit message>
```

### Step 5: Smart Checklist Population

Based on the commit types, auto-check the appropriate items:

| If commits include...     | Auto-check                                                           |
| ------------------------- | -------------------------------------------------------------------- |
| `test:` commits           | ✅ "I have added tests for new functionality"                       |
| `docs:` commits           | ✅ "I have updated documentation if needed"                        |
| `test:` commits           | ✅ "Unit tests added/updated" or "Integration tests added/updated" |
| Only `docs:` / `chore:`   | ✅ Mark test items as N/A with a note                              |

### Step 6: Present to User

Output two clearly separated sections:

1. **PR Title** — In a single-line code block, ready to copy
2. **PR Description** — In a fenced markdown code block, ready to paste into GitHub

## Output Format Example

---

**PR Title:**
```
feat(api): add vendor rating system
```

**PR Description:**

```markdown
## 📝 Description

Implements a vendor rating system allowing authenticated users to rate
vendors assigned to events. This includes the API endpoint, input
validation, duplicate-vote prevention, and comprehensive test coverage.

## 🎯 Type of Change

- [ ] 🐛 Bug fix (fixes an existing issue)
- [x] ✨ New feature (adds new functionality)
- [ ] 🔄 Enhancement (improves existing functionality)
- [x] 📖 Documentation update
- [ ] 🔧 Chore (dependency update, config change)
- [ ] 🎨 Style/formatting
- [ ] ♻️ Refactor (code restructuring without behavior change)

## 🔗 Related Issues

Closes #123

## 📋 Checklist

- [x] I have read the [CONTRIBUTING.md](https://github.com/NITRR-Official/CampusOS/blob/main/CONTRIBUTING.md) guide
- [x] My code follows the project's code style
- [x] I have updated documentation if needed
- [x] I have added tests for new functionality
- [x] I have run `pnpm lint` and fixed any errors
- [x] I have run `pnpm build` successfully
- [x] My commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## 🧪 Testing

- [x] Unit tests added/updated
- [ ] Integration tests added/updated
- [x] Manual testing — Verified endpoint via Postman

## 🖼️ Screenshots

N/A — Backend-only changes.

## 🚀 Performance Impact

No performance impact expected. The rating endpoint performs a single
database write operation.

## 📚 Additional Context

### Commits included:
- `a1b2c3d` — feat(api): add vendor rating endpoint
- `e4f5g6h` — test(api): add vendor rating tests
- `i7j8k9l` — docs: update API reference for vendor rating
```

---

## Important Notes

> [!IMPORTANT]
> The PR must **always target the `dev` branch**, never `main`. Include this reminder in your output if the user seems unsure.

> [!TIP]
> If the user provides commit titles without descriptions, generate the PR description by inferring the purpose from the commit titles and any available diff context.

## References

- PR template: `.github/pull_request_template.md`
- Contributing guide: `docs/contributing/CONTRIBUTING.md`
- Git workflow: `docs/guides/GIT_WORKFLOW.md`

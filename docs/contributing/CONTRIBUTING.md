# Contributing to CampusOS

Thank you for your interest in contributing! We welcome contributions from everyone, regardless of experience level.

## 🎯 Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## 🚀 Getting Started

1. **Fork the repository** on [GitHub](https://github.com/NITRR-Official/CampusOS)
2. **Clone your fork** and set up the development environment:

   ```bash
   git clone https://github.com/YOUR_USERNAME/CampusOS.git
   cd CampusOS
   git remote add upstream https://github.com/NITRR-Official/CampusOS.git
   pnpm install
   ```

3. **Start MongoDB** (required before the backend can run):

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

   For other methods, see the [Database Setup Guide](../getting-started/DATABASE_SETUP.md).

4. **Start the servers**:

   ```bash
   # Terminal 1: Backend
   cd backend && pnpm dev    # → http://localhost:4000

   # Terminal 2: Frontend
   cd frontend && pnpm dev   # → http://localhost:3000
   ```

For the full setup walkthrough, see [Quick Start](../getting-started/QUICK_START.md).

## 📋 How to Contribute

### Finding Issues

- [`good first issue`](https://github.com/NITRR-Official/CampusOS/issues?q=label%3Agood-first-issue) — Perfect for first-time contributors
- [`help wanted`](https://github.com/NITRR-Official/CampusOS/issues?q=label%3Ahelp-wanted) — More complex tasks
- [Roadmap](../project/ROADMAP.md) — Upcoming phases and features

### Before You Start

- **Check existing issues** — Make sure your idea isn't already being worked on
- **Discuss major changes** — For large features, open a discussion or issue first

### Branching

```bash
# Always branch from dev
git fetch upstream
git checkout -b feature/issue-number-description upstream/dev
```

> [!IMPORTANT]
> Always branch from `dev`, not `main`. All contributor PRs must target the `dev` branch.

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add QR code generation for check-ins"
git commit -m "fix: circular dependency detection in tasks"
git commit -m "docs: update contributor guide"

# Format: type(scope): subject
# Types: feat, fix, docs, test, chore, refactor, perf
```

### Code Quality

Before pushing, run:

```bash
pnpm format       # Auto-fix formatting (required — CI rejects unformatted code)
pnpm lint         # Lint
pnpm type-check   # TypeScript (frontend)
pnpm build        # Build check
```

> [!WARNING]
> **`pnpm format` is mandatory.** CI runs `pnpm format:check` which will **fail** if your code isn't formatted with Prettier. Always run `pnpm format` before pushing.

### Testing

Write tests for new features, bug fixes, and API endpoints.

```bash
pnpm test
```

**Coverage target:** 80%+

### Push and Create Pull Request

```bash
git push origin feature/issue-number-description
```

Open a PR on GitHub. **Set the base branch to `dev`** (not `main`).

> [!CAUTION]
> Always target the `dev` branch. PRs to `main` from contributors will be rejected — only admins merge `dev` → `main` for production releases.

**In the PR description:**

- Reference the issue: `Closes #123`
- Explain what changed and why
- Follow the [PR template](../../.github/pull_request_template.md)

## 🔍 Code Review Process

1. **Automated checks** — CI runs 5 quality checks: lint, type-check, format, test, build
2. **Preview deployments** — Vercel auto-deploys a frontend preview connected to the dev backend
3. **Manual review** — Code quality, architecture, test coverage, documentation
4. **Response times** — Critical bugs: 4 hours · High priority: 1 day · Medium/Low: 3–7 days
5. **Merge** — Need 1 approval. Maintainers squash-merge into `dev` for clean history.

## 🐛 Reporting Bugs

Use the [Bug Report](https://github.com/NITRR-Official/CampusOS/issues/new?template=bug_report.md) template. Include steps to reproduce, expected vs. actual behavior, and environment info.

## 💡 Suggesting Features

Use the [Feature Request](https://github.com/NITRR-Official/CampusOS/issues/new?template=feature_request.md) template. Describe the problem it solves and propose a solution.

## 🤔 Questions?

- 💬 [GitHub Discussions](https://github.com/NITRR-Official/CampusOS/discussions)
- 📖 [Developer Onboarding](../getting-started/DEVELOPER_ONBOARDING.md)

## 🎖️ Recognition

Contributors are recognized in [CONTRIBUTORS.md](./CONTRIBUTORS.md) after their first merged PR, in release notes, and in monthly community highlights.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**See Also**: [Developer Onboarding](../getting-started/DEVELOPER_ONBOARDING.md) · [Coding Guidelines](./CODING_GUIDELINES.md) · [Git Workflow](../guides/GIT_WORKFLOW.md) · [CI/CD Pipeline](../guides/CI_CD.md)

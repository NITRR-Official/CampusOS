# Contributing to CampusOS

Thank you for your interest in contributing to CampusOS! We welcome contributions from everyone, regardless of experience level. This guide will help you get started.

## 🎯 Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- pnpm 10.0.0 or higher
- Git

### Local Development Setup

1. **Fork the repository**

   ```bash
   # Go to https://github.com/NITRR-Official/CampusOS
   # Click "Fork" in the top-right corner
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/CampusOS.git
   cd CampusOS
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/NITRR-Official/CampusOS.git
   ```

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Start MongoDB Database (Required)**

   The backend **must** have a running MongoDB instance before it can start, otherwise you will get an `ECONNREFUSED` error. The easiest way is using Docker:

   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```
   *If you don't use Docker, you can install MongoDB natively by following the [official MongoDB installation guide](https://www.mongodb.com/docs/manual/installation/). For more details, see our [Database Setup Guide](./docs/DATABASE_SETUP.md).*

6. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Start development servers**

   ```bash
   # Terminal 1: Backend
   cd backend && pnpm dev

   # Terminal 2: Frontend
   cd frontend && pnpm dev
   ```

   Backend runs on `http://localhost:4000`
   Frontend runs on `http://localhost:3000`

## 📋 How to Contribute

### 1. Finding Issues to Work On

- Look for issues labeled `good first issue` (perfect for first-time contributors)
- Check out issues labeled `help wanted` for more complex tasks
- See the [ROADMAP.md](./ROADMAP.md) for upcoming phases and features

### 2. Before You Start

- **Check existing issues** - Make sure your idea isn't already being worked on
- **Discuss major changes** - For large features, please open a discussion or issue first
- **Follow the development approach**:
  - Backend-first: Implement APIs and business logic first
  - Then add frontend UI
  - Always prioritize code quality and testing

### 3. Making Changes

#### Branching Strategy

```bash
# Create feature branch from main
git checkout main
git pull upstream main
git checkout -b feature/issue-number-description
```

#### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Good examples:
git commit -m "feat: add QR code generation for check-ins"
git commit -m "fix: circular dependency detection in tasks"
git commit -m "docs: update contributor guide"
git commit -m "test: add test for task dependencies"

# Format: type(scope): subject
# Types: feat, fix, docs, test, chore, refactor, perf
# Scope: optional, e.g., (api), (frontend), (database)
```

#### Code Quality

Before pushing, run:

```bash
# Lint and format
pnpm lint
pnpm format

# Build
pnpm build

# Type check (TypeScript)
cd frontend && pnpm tsc --noEmit
```

### 4. Testing

**Write tests for:**

- New features
- Bug fixes
- API endpoints
- Business logic

```bash
pnpm test
```

**Test coverage target:** 80%+

### 5. Documentation

Update documentation if you:

- Add a new API endpoint
- Change existing functionality
- Add a new feature
- Modify database schema

Update these files as needed:

- `README.md` - Overview and setup
- `ROADMAP.md` - Phase progress
- Code comments for complex logic
- `/docs` folder for API documentation

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/issue-number-description

# Go to GitHub and click "Compare & pull request"
```

**In the PR description:**

- Reference the issue: `Closes #123`
- Explain what changed and why
- Link related issues or discussions
- Follow the [PR template](.github/pull_request_template.md)

## 🔍 Code Review Process

1. **Automated checks**
   - Tests pass
   - Linting passes
   - Build succeeds

2. **Manual review**
   - Code quality and readability
   - Architecture and design patterns
   - Test coverage
   - Documentation completeness

3. **Request changes vs. comment**
   - "Request changes" = blocking, must address
   - "Comment" = suggestion, not required

4. **Expected response time**
   - Critical bugs: 4 hours
   - High priority: 1 day
   - Medium/Low priority: 3-7 days

5. **Approval and merge**
   - Need at least 1 approval
   - Maintainers will squash and merge for clean history

## 🏗️ Architecture & Design Patterns

### Backend (Express.js)

- Plugin-based architecture (see `/apps/` directory)
- Each feature: schema → service → controller → routes
- RBAC with roles: `admin`, `coordinator`, `volunteer`
- See `/backend/src/` for middleware and utilities

### Frontend (Next.js)

- React components with TypeScript
- API clients in `/frontend/lib/` (e.g., `task-api.ts`)
- Pages in `/frontend/app/` organized by feature
- Tailwind CSS for styling

### Database (In-memory for now)

- Schema validation on write
- Services handle business logic
- See `apps/*/src/service/` for patterns

## 📚 Project Structure

```
campus-os/
├── apps/              # Feature modules (auth, task, event, etc.)
├── backend/           # Express server core
├── frontend/          # Next.js application
├── shared/            # Shared utilities (future)
├── .github/           # GitHub config (issues, workflows, etc.)
├── ROADMAP.md         # Development roadmap
├── CONTRIBUTING.md    # This file
└── README.md          # Project overview
```

## 🐛 Reporting Bugs

Use the [Bug Report](https://github.com/NITRR-Official/CampusOS/issues/new?template=bug_report.md) template.

**Good bug reports include:**

- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, Node version, etc.)
- Screenshots/logs if applicable

## 💡 Suggesting Features

Use the [Feature Request](https://github.com/NITRR-Official/CampusOS/issues/new?template=feature_request.md) template.

**Good feature requests:**

- Describe the problem it solves
- Explain the use case
- Propose a solution
- Link to related discussions

## 🤔 Questions?

- 💬 **Community Chat**: Check GitHub Discussions
- 📖 **Developer Guide**: See [Developer Onboarding Skill](./​github/skills/developer-onboarding/SKILL.md)
- 🛠️ **Setup Issues**: See Troubleshooting in README.md

## 🎖️ Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` (after first PR)
- Release notes (for significant contributions)
- Monthly community highlights

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Happy coding! We're excited to have you contribute to CampusOS.** 🚀

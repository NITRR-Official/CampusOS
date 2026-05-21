# CampusOS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/contributing/CONTRIBUTING.md)

**The Operating System for Campus Management — A modular, scalable platform for managing the complete lifecycle of campus activities.**

---

## 📖 About

CampusOS is an open-source campus management platform designed to replace fragmented tools like WhatsApp groups, Google Sheets, and email for coordinating campus activities.

Instead of building "just another event management tool," CampusOS provides the **complete infrastructure layer** for campus ecosystems, handling everything from organizational structure to operations to growth.

### Key Problems Solved

- **Coordination Chaos** — Centralized platform replacing scattered WhatsApp groups
- **Manual Operations** — Automated workflows for event management and logistics
- **Data Fragmentation** — Single source of truth for all campus activities
- **Vendor Management** — Streamlined vendor and resource coordination
- **Analytics Gap** — Comprehensive insights into campus activity health

### Who Is This For?

- **Club Organizers** — Easy event planning and coordination
- **Event Managers** — Streamlined check-in, RSVP, and logistics tracking
- **Institute Administrators** — Complete visibility into campus activities
- **Sponsors** — Measurable campaign performance and ROI tracking
- **Developers** — Clean, modular architecture for contributions

---

## ✨ Features

### Phase 1: Foundation ✅

- ✅ **Modular Architecture** — Pluggable modules for easy scaling
- ✅ **Authentication** — JWT-based secure auth system
- ✅ **User Management** — User profiles and role management
- ✅ **Club Management** — Club creation and hierarchy
- ✅ **RBAC** — Role-based access control

### Phase 2: Events ✅

- ✅ **Event Management** — Create, edit, and publish events
- ✅ **RSVP System** — Registration and attendance tracking
- ✅ **Event Listing** — Public event discovery pages
- ✅ **Registration UI** — Streamlined RSVP interface

### Phase 3: Execution Engine ✅

- ✅ **Task Management** — Create, assign, track tasks
- ✅ **Task Dependencies** — Dependency chains with circular ref detection
- ✅ **Status & Priority** — Workflow states and prioritization
- ✅ **Calendar Events** — Deadline tracking and scheduling

### Phase 4: Live Event Support ✅

- ✅ **QR Code Check-in** — Automated attendance tracking
- ✅ **Check-in API** — Endpoint-based scanning
- ✅ **Attendance Stats** — Real-time attendance analytics
- ✅ **Participant Dashboard** — Event history and status tracking

### Phase 5: Operations Layer ✅

- ✅ **Vendor Management** — Vendor coordination and procurement
- ✅ **Resource Allocation** — Resource scheduling and management
- ✅ **Budget Tracking** — Expense and budget management

### Phase 6: Growth Layer (Coming Soon)

- 📋 **Sponsorship Management** — Sponsor tracking and engagement
- 📋 **Marketing Tools** — Campaign management and assets
- 📋 **System Analytics** — Comprehensive reporting

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.0.0 or higher
- **pnpm** v10.0.0 or higher
- **Git**
- **MongoDB** — via [Docker](https://www.docker.com/) (recommended), native install, or [MongoDB Atlas](https://cloud.mongodb.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/NITRR-Official/CampusOS.git
cd CampusOS

# Install dependencies (pnpm workspaces)
pnpm install
```

### Database Setup

The backend requires MongoDB to be running. Easiest way:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

> For other methods (native install, Atlas), see the [Database Setup Guide](./docs/getting-started/DATABASE_SETUP.md).

### Configuration

**Optional: Environment Variables**

Create `.env` in project root to override defaults:

```env
# Backend
NODE_ENV=development
PORT=4000
JWT_SECRET=dev-fallback-secret
MONGODB_URI=mongodb://localhost:27017/campusos

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Running the Project

```bash
# Terminal 1: Start Backend (from project root)
cd backend
pnpm dev

# Terminal 2: Start Frontend (from project root)
cd frontend
pnpm dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:3000

---

## 📚 Documentation

- **[Documentation Hub](./docs/README.md)** — Central index for all project documentation
- **[Quick Start](./docs/getting-started/QUICK_START.md)** — Get up and running fast
- **[Architecture Overview](./docs/architecture/OVERVIEW.md)** — System design and principles
- **[Project Structure](./docs/project/PROJECT_STRUCTURE.md)** — Directory layout and module organization
- **[Roadmap](./docs/project/ROADMAP.md)** — Development phases and timeline
- **[Architecture Decisions](./docs/architecture/decisions/)** — ADRs and design decisions
- **[AI Development Guidelines](./docs/ai-development/COPILOT_GUIDELINES.md)** — Copilot rules and patterns

---

## 🏷️ Finding Issues to Contribute

### Labels Guide

Look for these GitHub issue labels to find work that matches your interests and experience:

**Difficulty Levels:**

- 🟢 `good-first-issue` — Perfect for first-time contributors
- 🟡 `help-wanted` — Needs expertise or community input
- 🔴 `p0-critical` — High priority, urgent fixes

besides these there are other difficulty level labels and priority labels.

**By Category:**

- `backend` — Node.js/Express changes
- `frontend` — Next.js/React changes
- `database` — Data schema or queries
- `infrastructure` — DevOps, CI/CD, deployment
- `documentation` — Docs, guides, comments

**By Status:**

- `in-progress` — Someone is actively working on it
- `needs-review` — Waiting on code review
- `blocked` — Depends on another issue

### Issue Templates

When creating a new issue, choose the appropriate template:

- 🐛 **[Bug Report](https://github.com/NITRR-Official/CampusOS/issues/new?template=bug_report.md)** — Found a problem?
- ✨ **[Feature Request](https://github.com/NITRR-Official/CampusOS/issues/new?template=feature_request.md)** — Have an idea?
- 📚 **[Documentation](https://github.com/NITRR-Official/CampusOS/issues/new?template=documentation.md)** — Docs need help?

---

## 🧠 Developer Resources

Explore these guides to understand how CampusOS works:

- 📖 **[Developer Onboarding](./docs/getting-started/DEVELOPER_ONBOARDING.md)** — Setup and first contribution
- 📦 **[Backend Architecture](./docs/architecture/BACKEND.md)** — Express server and plugin system
- 🎨 **[Frontend Overview](./docs/frontend/OVERVIEW.md)** — React/Next.js patterns and conventions
- 📡 **[API Standards](./docs/guides/API_STANDARDS.md)** — REST endpoint design patterns
- 🗄️ **[Database Setup](./docs/getting-started/DATABASE_SETUP.md)** — MongoDB setup and schema design
- 🧪 **[Testing Guide](./docs/guides/TESTING.md)** — Test pyramid and coverage targets
- 🔒 **[Security Guidelines](./docs/guides/SECURITY.md)** — OWASP, auth, and input validation
- 👥 **[Code Review](./docs/guides/CODE_REVIEW.md)** — Review checklist and quality standards
- 🚀 **[Deployment](./docs/guides/DEPLOYMENT.md)** — Docker, CI/CD, and production readiness

---

## 🛠️ Tech Stack

- **Backend:** [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) — Fast, lightweight server
- **Frontend:** [Next.js](https://nextjs.org/) + [React](https://react.dev/) — Modern, full-stack framework
- **Database:** [MongoDB](https://www.mongodb.com/) — Flexible schema for rapid development
- **Architecture:** Modular, plugin-based system with dynamic loading

---

## 🏗️ Architecture Highlights

### Modular Design

Every feature is a self-contained module in `/apps/`:

- Routes, controllers, services, and schemas together
- No direct module-to-module dependencies
- Communication via shared services or database

### Plugin System

- Dynamic module loading at startup
- Enable/disable features per deployment
- Extensible without core changes

### System Layers

1. **Foundation** — Auth, Users, Clubs, RBAC
2. **Event** — Events, RSVP, Check-in
3. **Execution** — Tasks, Workflows, Calendar
4. **Operations** — Vendors, Resources, Budget
5. **Growth** — Sponsorship, Marketing
6. **System** — Notifications, Audit, Analytics

---

## 🤝 Contributing

We welcome contributions from everyone! Whether you're fixing bugs, adding features, or improving documentation, your help makes CampusOS better.

**New to CampusOS?** Start here:

- 📖 [**CONTRIBUTING.md**](./docs/contributing/CONTRIBUTING.md) — Complete contributor guide with setup instructions
- 🐛 [**Bug Report Template**](https://github.com/NITRR-Official/CampusOS/issues/new?template=bug_report.md)
- ✨ [**Feature Request Template**](https://github.com/NITRR-Official/CampusOS/issues/new?template=feature_request.md)
- 📚 [**Documentation Issues**](https://github.com/NITRR-Official/CampusOS/issues/new?template=documentation.md)

**Community:**

- 💬 [GitHub Discussions](https://github.com/NITRR-Official/CampusOS/discussions) — Ask questions
- 📋 [Issue Tracker](https://github.com/NITRR-Official/CampusOS/issues) — Report bugs or suggest features
- 🏆 [CONTRIBUTORS.md](./docs/contributing/CONTRIBUTORS.md) — See who's contributed

### How to Contribute

1. **Fork & Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/CampusOS.git
   cd CampusOS
   git remote add upstream https://github.com/NITRR-Official/CampusOS.git
   ```

2. **Create a Feature Branch from `dev`**

   ```bash
   git fetch upstream
   git checkout -b feature/your-feature-name upstream/dev
   ```

3. **Make Your Changes**
   - Follow [modular architecture](./README.md#-architecture-highlights)
   - Keep modules independent
   - Write tests for new functionality
   - Update documentation as needed

4. **Commit with Clear Messages**

   ```bash
   git commit -m "feat: add check-in QR code generation"
   ```

5. **Push & Create Pull Request to `dev`**
   ```bash
   git push origin feature/your-feature-name
   # Then create PR via GitHub UI — target the `dev` branch
   ```

> **Note**: All PRs should target the `dev` branch. Only admins merge `dev` → `main` for production releases.

### Code Guidelines

- **Architecture** — Follow modular structure in `/apps/` (schema → service → controller → routes)
- **Quality** — Run `pnpm lint`, `pnpm type-check`, and `pnpm build` before pushing
- **Testing** — Write tests for new features (aim for 80%+ coverage)
- **Types** — Use TypeScript on frontend, JSDoc on backend
- **Commits** — Use [Conventional Commits](https://www.conventionalcommits.org/)

### Review Process

- ✅ Automated checks: tests, lint, build
- 👀 Manual review: code quality, architecture, documentation
- 💬 Feedback: constructive suggestions on your PR
- ✨ Merge: Once approved and all checks pass

**Questions?** Check [CONTRIBUTING.md](./docs/contributing/CONTRIBUTING.md) for detailed setup and troubleshooting.

---

## 🤝 Community & Conduct

**Our Community:** CampusOS is maintained by NIT Raipur and welcomes contributors worldwide.

- 📖 **[Code of Conduct](./docs/contributing/CODE_OF_CONDUCT.md)** — Guidelines for respectful community
- 🤝 **[CONTRIBUTORS.md](./docs/contributing/CONTRIBUTORS.md)** — Recognition for contributors
- 💬 **[Discussions](https://github.com/NITRR-Official/CampusOS/discussions)** — Ask questions and share ideas

**Need Help?**

- 📋 Open an [Issue](https://github.com/NITRR-Official/CampusOS/issues) — Report bugs or request features
- 💭 Start a [Discussion](https://github.com/NITRR-Official/CampusOS/discussions) — Ask questions
- 📚 Read [CONTRIBUTING.md](./docs/contributing/CONTRIBUTING.md) — Setup and guidelines

## 👥 Maintainers

This project is maintained by:

- **NITRR Open Source Team** — Core maintainers

---

## 🎯 Roadmap

### Phase 0: System Initialization ✅

- [x] Project structure setup
- [x] Humanet documentation
- [x] Architecture decisions
- [x] Copilot guidelines & skills

### Phase 1: Foundation System ✅

- [x] Auth module (JWT)
- [x] User management
- [x] Club management
- [x] RBAC system (admin/coordinator/volunteer)

### Phase 2: Event System ✅

- [x] Event management (CRUD)
- [x] RSVP system (registration)
- [x] Public event pages
- [x] Event discovery

### Phase 3: Execution Engine ✅

- [x] Task management (create/assign/status)
- [x] Task dependencies (circular detection)
- [x] Workflow states (todo/in-progress/done)
- [x] Calendar management

### Phase 4: Live Event Support ✅

- [x] QR code generation
- [x] Check-in API
- [x] Attendance tracking
- [x] Participant dashboard

### Phase 5: Operations Layer ✅

- [x] Vendor management
- [x] Resource allocation
- [x] Budget tracking

### Phase 6: Growth Layer 🟡 (Next)

- [ ] Sponsorship management
- [ ] Marketing tools

### Phase 7: System Maturity

- [ ] Notifications
- [ ] Audit Logs
- [ ] Analytics
- [ ] Production readiness

See [Project Board](https://github.com/NITRR-Official/CampusOS/projects) for real-time progress.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Open Source Community** — For inspiring modular architecture patterns
- **Campus Ecosystem** — The problem domain that inspired this project
- **All Contributors** — Thank you for making this better

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/NITRR-Official/CampusOS/issues)
- **Discussions:** [GitHub Discussions](https://github.com/NITRR-Official/CampusOS/discussions)
- **Documentation:** [docs/](./docs/README.md)
- **Architecture:** [Architecture Decisions](./docs/architecture/decisions/)




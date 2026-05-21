# CampusOS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./docs/contributing/CONTRIBUTING.md)

**The Operating System for Campus Management** — A modular, open-source platform that replaces fragmented tools (WhatsApp groups, Google Sheets, email) with a single system for managing clubs, events, tasks, operations, and growth.

---

## 🚀 Quick Start

**Prerequisites:** [Node.js](https://nodejs.org/) v18+, [pnpm](https://pnpm.io/) v10+, [MongoDB](https://www.mongodb.com/) (via [Docker](https://www.docker.com/), native, or [Atlas](https://cloud.mongodb.com))

```bash
# Clone & install
git clone https://github.com/NITRR-Official/CampusOS.git
cd CampusOS
pnpm install

# Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Run (two terminals)
cd backend && pnpm dev    # → http://localhost:4000
cd frontend && pnpm dev   # → http://localhost:3000
```

> Need help? See the full [Quick Start Guide](./docs/getting-started/QUICK_START.md) or [Database Setup](./docs/getting-started/DATABASE_SETUP.md).

---

## 🛠️ Tech Stack

| Layer        | Technology                                                       |
| ------------ | ---------------------------------------------------------------- |
| **Backend**  | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| **Frontend** | [Next.js](https://nextjs.org/) + [React](https://react.dev/)    |
| **Database** | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) |
| **Arch**     | Modular plugin system with dynamic loading                       |

---

## 📚 Documentation

Everything you need is in the **[Documentation Hub →](./docs/README.md)**

| Topic                  | Link                                                     |
| ---------------------- | -------------------------------------------------------- |
| Quick Start            | [Getting Started](./docs/getting-started/QUICK_START.md) |
| Developer Onboarding   | [First Contribution](./docs/getting-started/DEVELOPER_ONBOARDING.md) |
| Architecture           | [Overview](./docs/architecture/OVERVIEW.md)              |
| Project Structure      | [Directory Layout](./docs/project/PROJECT_STRUCTURE.md)  |
| API Standards          | [REST Patterns](./docs/guides/API_STANDARDS.md)          |
| Testing                | [Test Guide](./docs/guides/TESTING.md)                   |
| Roadmap                | [Phases & Progress](./docs/project/ROADMAP.md)           |

---

## 🤝 Contributing

We welcome contributions from everyone! Look for issues labelled **`good-first-issue`** to get started.

1. Read the **[Contributing Guide](./docs/contributing/CONTRIBUTING.md)**
2. Fork → branch from `dev` → make changes → open PR to `dev`
3. Follow [Coding Guidelines](./docs/contributing/CODING_GUIDELINES.md) and [Conventional Commits](https://www.conventionalcommits.org/)

> **All PRs target the `dev` branch.** Only maintainers merge `dev` → `main` for releases.

**Create an issue:**
[🐛 Bug Report](https://github.com/NITRR-Official/CampusOS/issues/new?template=bug_report.md) · [✨ Feature Request](https://github.com/NITRR-Official/CampusOS/issues/new?template=feature_request.md) · [📚 Documentation](https://github.com/NITRR-Official/CampusOS/issues/new?template=documentation.md)

---

## 🌐 Community

- 💬 [GitHub Discussions](https://github.com/NITRR-Official/CampusOS/discussions) — Questions & ideas
- 📋 [Issue Tracker](https://github.com/NITRR-Official/CampusOS/issues) — Bugs & feature requests
- 📖 [Code of Conduct](./docs/contributing/CODE_OF_CONDUCT.md)
- 🏆 [Contributors](./docs/contributing/CONTRIBUTORS.md)

Maintained by **NITRR Open Source Team**

---

## 📜 License

[MIT](./LICENSE)

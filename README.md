# CampusOS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

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

### Phase 1: Foundation (In Progress)
- ✅ **Modular Architecture** — Pluggable modules for easy scaling
- ✅ **Authentication** — JWT-based secure auth system
- ✅ **User Management** — User profiles and role management
- ✅ **Club Management** — Club creation and hierarchy
- ✅ **RBAC** — Role-based access control

### Phase 2: Events
- 🚧 **Event Management** — Create, edit, and publish events
- 🚧 **RSVP System** — Registration and attendance tracking
- 🚧 **Check-in** — Event-day attendance management
- 🚧 **Analytics** — Event metrics and reporting

### Phase 3: Execution
- 📋 **Task Management** — Create and assign tasks
- 📋 **Workflows** — Track task execution states
- 📋 **Calendar** — Schedule and deadline management

### Phase 4: Operations
- 📋 **Vendor Management** — Vendor coordination and procurement
- 📋 **Resource Allocation** — Resource scheduling and management
- 📋 **Budget Tracking** — Expense and budget management

### Phase 5: Growth
- 📋 **Sponsorship Management** — Sponsor tracking and engagement
- 📋 **Marketing Tools** — Campaign management and assets
- 📋 **System Analytics** — Comprehensive reporting

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.0.0 or higher
- **pnpm** v8.0.0 or higher
- **MongoDB** (local or cloud instance)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/NITRR-Official/CampusOS.git

# Navigate to project directory
cd CampusOS

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Copy environment template
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
```

### Configuration

**Backend Setup (.env.local)**
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/campus-os
JWT_SECRET=your-secret-key
```

**Frontend Setup (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Running the Project

```bash
# Terminal 1: Start Backend (from project root)
cd backend
npm run dev

# Terminal 2: Start Frontend (from project root)
cd frontend
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## 📚 Documentation

- **[Project Structure](./humanet/PROJECT_STRUCTURE.md)** — Detailed architecture and module layout
- **[Problem Statement](./.humanet/problem_statement.md)** — The problem we're solving
- **[Architecture Decisions](./.humanet/discussions/)** — ADRs and design decisions
- **[Roadmap](./ROADMAP.md)** — Development phases and timeline
- **[Copilot Guidelines](./COPILOT.md)** — AI development rules and patterns
- **[Humanet Context](./.humanet/)** — Project documentation and governance

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

We welcome contributions from everyone!

**Quick Links:**
- 📖 [Contributing Guidelines](CONTRIBUTING.md)
- 🐛 [Report a Bug](https://github.com/NITRR-Official/CampusOS/issues/new)
- 💡 [Request a Feature](https://github.com/NITRR-Official/CampusOS/issues/new)
- 💬 [Join Discussion](https://github.com/NITRR-Official/CampusOS/discussions)

### Getting Started with Development

1. **Read the docs** — Start with [COPILOT.md](./COPILOT.md)
2. **Understand the architecture** — Check [.humanet/](./humanet/)
3. **Pick an issue** — Look for `good-first-issue` label
4. **Create a feature branch** — `git checkout -b feature/your-feature`
5. **Make your changes** — Follow modular structure
6. **Update documentation** — Update Humanet if needed
7. **Submit a PR** — Include description of changes

### Code Guidelines
- Follow modular architecture strictly
- Keep modules independent
- Write tests for new features
- Update Humanet documentation
- Keep controllers thin, logic in services

---

## 👥 Maintainers

This project is maintained by:

- **NITRR Open Source Team** — Maintained by NIT Raipur

**Need help?** 
- Open a [GitHub Issue](https://github.com/NITRR-Official/CampusOS/issues)
- Start a [Discussion](https://github.com/NITRR-Official/CampusOS/discussions)
- Check [Humanet docs](./.humanet/)

---

## 🎯 Roadmap

### Phase 0: System Initialization ✅
- [x] Project structure setup
- [x] Humanet documentation
- [x] Architecture decisions

### Phase 1: Foundation System (In Progress)
- [ ] Auth module
- [ ] User management
- [ ] Club management
- [ ] RBAC system

### Phase 2: Event System
- [ ] Event management
- [ ] RSVP system
- [ ] Check-in system

### Phase 3: Execution System
- [ ] Task management
- [ ] Workflow system
- [ ] Calendar management

### Phase 4: Operations System
- [ ] Vendor management
- [ ] Resource allocation
- [ ] Budget tracking

### Phase 5: Growth System
- [ ] Sponsorship management
- [ ] Marketing tools
- [ ] Analytics

### Phase 6: System Maturity
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Production readiness

See [Project Board](https://github.com/NITRR-Official/CampusOS/projects) for real-time progress.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Open Source Community** — For inspiring modular architecture patterns
- **Campus Ecosystem** — The problem domain that inspired this project
- **All Contributors** — Thank you for making this better

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/NITRR-Official/CampusOS/issues)
- **Discussions:** [GitHub Discussions](https://github.com/NITRR-Official/CampusOS/discussions)
- **Documentation:** [.humanet/](./.humanet/)
- **Architecture:** [Discussions](./.humanet/discussions/)

---

<p align="center">
  Made with ❤️ by Students-NIT Raipur</a>
  <br>
  <a href="https://github.com/NITRR-Official/CampusOS">CampusOS</a> — The Operating System for Campus Management
</p>

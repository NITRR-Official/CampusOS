# 🧠 Copilot System Context — CampusOS

## 🎯 Project Overview

CampusOS is a modular, plugin-based platform designed to manage:

- Clubs
- Events
- Tasks & execution workflows
- Operations (vendors, resources, budgeting)
- Sponsorship & marketing

The system is built using:

- Backend: Node.js + Express
- Frontend: Next.js
- Database: MongoDB
- Architecture: Modular plugin-based system

---

## 🧩 Architecture Principles

1. Everything is a module
2. Modules live inside `/apps/`
3. Core system handles:
   - Authentication
   - Plugin loading
   - Routing

4. Each module must be self-contained:
   - routes
   - controller
   - service
   - schema/model

---

## 📁 Folder Structure Rules

- `/apps/*` → feature modules
- `/backend/` → core server
- `/frontend/` → UI
- `/shared/` → types, schemas

---

## 🔌 Module Rules

Every module must:

- Have `plugin.js` entry
- Export:
  - name
  - routes
  - init()

Modules must NOT directly depend on each other.
Communication must happen via shared services or DB.

---

## 🧠 Humanet Integration

Before implementing ANY feature:

1. Read:
   - `.humanet/problem_statement.md`
   - `.humanet/idea.md`
   - `.humanet/scope.md`

2. Ensure:
   - Feature aligns with scope
   - No unnecessary complexity
   - Ask if you want any clarity related to any implementation or humanet docs

---

## 🚫 Constraints

- Do NOT over-engineer
- Do NOT introduce new architecture patterns without justification
- Follow modular structure strictly

---

## ✅ Coding Guidelines

### Backend

- Use Express routers
- Use middleware for validation
- Keep controllers thin
- Business logic in services

### Package Management

- **Install packages via CLI only**:
  - `pnpm install <package-name>`
  - `pnpm install -D <package-name>` (dev dependencies)
- **DO NOT directly edit package.json** for version management
- Use `pnpm update` for version updates
- Pin major versions, use `^` for minor/patch
- All package decisions must be justified

---

### Frontend

- Use reusable components
- Separate UI and logic
- Fetch via service layer

---

## 🔄 Development Workflow

When implementing a feature:

1. Understand requirement
2. Check Humanet docs
3. Design module
4. Implement backend
5. Implement frontend
6. Connect both
7. Update `.humanet/CHANGELOG.md`

---

## 🧾 Output Expectations

When generating code:

- Follow project structure
- Use clean naming
- Add comments where needed
- Avoid unnecessary dependencies

---

## 🎯 Goal

Build a scalable, modular, production-grade CampusOS system with clean architecture and maintainability.

---

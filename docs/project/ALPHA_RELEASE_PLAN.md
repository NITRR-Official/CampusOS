# Alpha Release Plan (v1.0.0-alpha)

**Goal:** Deliver a highly functional, extensible MVP demonstrating the newly refactored plugin architecture while providing immediate core value (event registration and club management) to users.

This document serves as the tactical roadmap to reach `v1.0.0-alpha`.

---

## 🚀 1. The Plugin Architecture Foundation (Completed)
The Alpha release will showcase the core extensibility of CampusOS. 
- **Backend**: Dynamic plugin loading (`PluginManager`) with completely isolated Mongoose schemas per plugin.
- **Frontend**: Build-time plugin UI integration leveraging the `PluginRegistry` and `<ExtensionPoint>` pattern to ensure zero monolithic UI bloating.

## 🚌 2. Core Event Bus (Completed)
To ensure plugins remain truly decoupled, we will introduce an internal Event Bus.
- **Pattern**: A lightweight Node.js `EventEmitter` instance managed by the core platform and injected into the `initialize()` method of every plugin.
- **Goal**: Allow plugins to communicate asynchronously. 
  - *Example:* The `event` module emits `event:created`. The `budget` module listens for this and automatically drafts an empty budget allocation without the `event` module needing to know the `budget` module exists.

## 🛡️ 3. AuthN & AuthZ (Discord-Style RBAC)
Rigid roles (`admin`, `user`) are insufficient for a university ecosystem.
- **Atomic Permissions**: Implement granular, bitwise or string-based permissions (e.g., `can:create_event`, `can:manage_budget`, `can:approve_club`).
- **Resource Binding**: Users will hold specific roles *within* specific clubs, rather than just global roles.
- **Goal**: Enable institutes to create custom roles ("Treasurer", "Event Coordinator") with tailored permissions.

## 📱 4. Essential Public Routes & UX
The core MVP requires a polished frontend for end-users (students) to interact with the platform.
- **Events Hub**: 
  - Public listing of all active events.
  - Detail pages with rich markdown descriptions.
  - One-click event registration system.
- **Clubs Hub**: 
  - Public listing of university clubs.
  - Club detail pages showing active members and upcoming club events.
- **Student Profile (Dashboard)**:
  - A dynamic dashboard utilizing `<ExtensionPoint id="profile-tabs" />`.
  - Modules will inject tabs to show the user's "Registered Events", "Club Memberships", and "Active Tasks".

## 📊 5. Basic Analytics
Scope-creep in analytics is a common pitfall. The Alpha will strictly focus on aggregate counters.
- **Data Points**: Total registered users, total active clubs, total upcoming events, and specific event RSVP counts.
- **Implementation**: Simple cached database counts displayed elegantly on the dashboard using our shadcn/ui components.

---

## 🛠️ Execution Milestones (Next Steps)

| Milestone | Focus Area | Tasks | Status |
| :--- | :--- | :--- | :--- |
| **M1** | Communication | Implement `EventEmitter` Event Bus in backend core. | 🟢 Next |
| **M2** | Security | Migrate to Discord-style atomic RBAC permissions. | 🟡 Pending |
| **M3** | User Experience | Polish Frontend UI for Events, Clubs, and Profile Dashboards. | 🟡 Pending |
| **M4** | Integration | Connect Event Registration to the Profile Dashboard. | 🟡 Pending |
| **M5** | Alpha Release | Final bug bash, seed data generation, and `v1.0.0-alpha` tag. | 🟡 Pending |

---

## 🔭 Future Planning (Post-Alpha)
Once the Alpha is stable, we will immediately pivot to:
1. **Developer Experience (DX)**: Drafting the formal SDK documentation, API specs, and tutorials for third-party developers to build their own CampusOS plugins.
2. **Operations Maturation**: Polishing the UI for the `budget`, `vendor`, and `scheduling` plugins.
3. **Notification System**: Implementing an overarching notification bus (In-app + Email via SendGrid/Resend).

---
name: project-context
description: Core context and status of the CampusOS architecture migration and development.
---

# CampusOS Project Context

## Overview
CampusOS is a monolithic, modular platform for managing college campuses (specifically NITRR). It follows a plugin-based backend architecture where each module (club, event, budget, etc.) acts as an isolated plugin. The frontend is built with React/Next.js and focuses purely on UI rendering, while backend plugins manage all business logic.

## Core Architectural Principles
1. **Plugin Isolation**: Plugins must NOT import files directly from other plugins. They are completely isolated modules.
2. **Service Registry (`ServiceRegistry`)**: Plugins must expose their public API through the global `ServiceRegistry`. This is the ONLY way plugins can synchronously interact with each other.
3. **Event Bus (`EventBus`)**: For asynchronous or side-effect operations (e.g. cascading deletes), plugins communicate via the `EventBus`.
4. **Database Models**: All plugins must register their Mongoose models through the `core:models` service to ensure they use the same database connection and are initialized properly. 
5. **Decoupled Frontend**: The frontend handles layout and routing. It uses React Query (and `zod` for validation) to communicate with backend APIs. The frontend MUST NOT encode complex business logic.

## Current Migration Status
We are in the middle of a major migration from in-memory repositories to MongoDB (Mongoose) models, enforcing strictly decoupled SOLID principles.

### Completed:
- Initialized MongoDB schemas for all plugins.
- Migrated all plugins from in-memory repositories to Mongoose-based repositories.
- Enforced strict ServiceRegistry usage; removed cross-plugin file imports.
- Re-added database compound indexes (especially on foreign keys like `instituteId`, `clubId`, `eventId`) for performance.
- Implemented global cascade delete enforcement via EventBus (`club:deleted`, `event:deleted`, `user:deleted`).

### Remaining (Next Steps):
- **Step 4: Standardized Error Handling**: Audit and standardize `catch` blocks in controllers to use Zod error formatting and consistent HTTP status codes.
- **Step 5: Frontend React Query Integration**: Fully integrate the frontend using React Query and standardize API client usage to consume the refactored endpoints.

## Documentation
- **Architecture Decisions**: See `docs/architecture/decisions/` (ADRs) for historical and recent architectural decisions. ADR-009 details the frontend decoupling strategy.
- **Tasks**: See `task.md` in the current conversation artifacts for the exact checklist.

When starting a new session, ALWAYS refer to the ADRs and this skill file to maintain consistency in our architecture. Do not revert to direct imports or tight coupling.

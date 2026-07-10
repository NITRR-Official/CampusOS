# ADR 009: Frontend Decoupling & API Standardization

## Status

Accepted (Implemented 2026-07-11)

## Context

Following ADR-007, the frontend architecture was designed to support build-time plugin integration. However, in practice, domain-specific pages (like `/events`, `/clubs`, `/calendar`) were still tightly coupled inside the core `frontend/app/(dashboard)/` directory. Furthermore, data fetching across these plugins relied on legacy `useState` and `useEffect` hooks, and lacked strict schema validation, leading to potential runtime errors and inconsistent API boundaries.

## Decision

1. **Strict Micro-Frontend Decoupling**: All domain-specific pages are completely extracted from the core frontend into their respective plugins (e.g., `plugins/event/frontend/pages/`). The core frontend router (`frontend/app/(dashboard)/*`) now acts only as a slim wrapper that imports and renders these plugin components.
2. **Admin Plugin Extraction**: Created a dedicated `admin` plugin to house the system-wide Admin Dashboard, moving it out of the core frontend to keep the core as lightweight as possible.
3. **Zod & React Query Standardization**: All plugins must use strict `@tanstack/react-query` hooks for data fetching and mutations, replacing all legacy `useEffect` logic. All API responses must be validated against strict `zod` schemas.

## Rationale

- **Separation of Concerns**: The core frontend repo now contains zero domain knowledge. It only handles layout, authentication wrappers, and routing.
- **Type Safety**: Zod guarantees that the frontend receives exactly the data structure it expects from the backend, failing gracefully if the backend contract changes.
- **Performance & UX**: React Query provides built-in caching, automatic background refetching, and simplified loading/error states.

## Consequences

### Positive
- A highly modular, scalable frontend codebase.
- Eliminated all residual `any` types and runtime data mismatches in the API layer.
- Open-source contributors can now build fully self-contained plugins with their own pages and strict schemas.

### Negative
- Increased boilerplate for defining Zod schemas for every API endpoint.

## Related ADRs
- ADR-007: Frontend Plugin Architecture (Build-Time Integration)

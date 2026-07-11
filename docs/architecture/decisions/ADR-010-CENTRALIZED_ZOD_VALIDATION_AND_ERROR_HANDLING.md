# ADR 010: Centralized Zod Validation and Error Handling

## Status

Accepted (Implemented 2026-07-11)

## Context

Previously, each backend plugin handled data validation independently, often mixing schema validation directly into the business logic or using ad-hoc validation functions. Furthermore, there was no separation between data validation schemas and database persistance models. The error responses were also inconsistently formatted across different endpoints, leading to a fragmented API experience and potential security vulnerabilities related to payload injection.

## Decision

1. **Strict Separation of Concerns**: We have separated Mongoose data models (`*.model.js`) from Zod validation schemas (`*.schema.js`) in all plugins.
2. **Centralized Error Handling**: We implemented a global error middleware (`middleware/error.js`) that intercepts `ZodError` instances and automatically formats them into a standardized 400 Bad Request response.
3. **Zod Validation Standardization**: All incoming request payloads must be strictly validated using `zod` schemas (`z.object({...}).strict()`) before any business logic is executed in the controller.
4. **Security Hardening**: All Zod schemas enforce string length limits, trim whitespace, and strictly forbid unexpected payload fields to prevent DoS attacks and NoSQL injection.
5. **Workspace Dependencies**: `zod` was installed at the monorepo root to ensure it is uniformly available across all backend plugins during runtime.

## Rationale

- **Security & Reliability**: `strict()` parsing ensures no extra fields are passed to the database layer, protecting against mass assignment vulnerabilities. Explicit boundaries and type assertions prevent runtime crashes from malformed inputs.
- **Maintainability**: Moving validation logic to standardized Zod schemas cleans up controller logic and ensures all endpoints behave predictably.
- **Developer Experience**: A unified API response structure for validation errors makes it much easier for the frontend to handle and display form errors consistently.

## Consequences

### Positive

- Improved security posture with robust payload validation.
- Cleaner controller code devoid of manual `if (!req.body.field)` checks.
- Consistent API error responses for frontend consumers.
- Clear separation between the data persistance layer (Mongoose) and the validation layer (Zod).

### Negative

- Slightly increased boilerplate to define Zod schemas for every endpoint.

## Related ADRs

- ADR-009: Frontend Decoupling & API Standardization

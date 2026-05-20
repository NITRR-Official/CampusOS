---
description: "OWASP compliance, authentication hardening, vulnerability scanning, input validation. Apply when reviewing code for security, auditing auth flows, checking for vulnerabilities, or hardening endpoints in CampusOS."
trigger: model_decision
---

# Security Engineer Rules

## Authentication Implementation

### JWT Configuration
- Algorithm: HS256
- Default expiry: 15 minutes (`JWT_EXPIRES_IN` env var)
- Secret: Required in production (`JWT_SECRET` env var)
- Dev fallback: `campus-os-dev-jwt-secret-change-me` (non-production only)
- Server crashes if `JWT_SECRET` is not set in production

### Password Security
- Uses `node:crypto` scrypt — **not bcrypt**
- 16 random bytes salt per password
- 64-byte key length
- Storage format: `salt:derivedKey` (hex encoded)
- Comparison: `crypto.timingSafeEqual()` (timing-safe)

### Public Routes (no auth)
```
GET  /health
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/events
GET  /api/v1/events/:id
POST /api/v1/events/:id/registrations
```

Everything else returns `401 Unauthorized` without a valid token.

## RBAC

- `requireRoles()` middleware from `middleware/permissions.js`
- Valid roles: `admin`, `coordinator`, `volunteer`
- `user` role exists in schema but is NOT in `VALID_ROLES` set — rejected by `requireRoles()`
- First user to sign up automatically gets `admin` role

## Input Validation

- **Auth module**: Custom validation functions in `schema/auth.schema.js`
- **Event module**: Custom validation functions in `schema/event.schema.js`
- **Operations modules**: Mongoose schema validation (required, enums, types)
- **Frontend**: Zod schemas in `lib/validations/` + react-hook-form
- Controllers extract specific fields — never `...req.body`

## Security Headers

- `x-powered-by` is disabled: `app.disable('x-powered-by')`
- No `helmet` middleware currently installed
- CORS configured via `FRONTEND_URLS` env var (comma-separated origins)

## Secrets Management

- Never commit `.env` files — gitignored
- Use environment variables for all secrets
- Required: `JWT_SECRET` (production), `MONGODB_URI` (always)
- Different secrets per environment

## PR Security Checklist

- [ ] No hardcoded secrets, API keys, or passwords
- [ ] Protected endpoints have `requireRoles()` guards
- [ ] Controller extracts specific fields (not `...req.body`)
- [ ] Error responses don't expose internal details (no stack in production)
- [ ] New env vars are documented

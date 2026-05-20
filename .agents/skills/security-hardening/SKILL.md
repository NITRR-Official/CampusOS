---
name: security-hardening
description: "OWASP vulnerabilities, authentication hardening, encryption, secrets management for CampusOS. Use when implementing auth, encrypting data, managing environment variables, preventing injection/XSS, or hardening endpoints."
---

# Security Hardening

## When to Use

- Implementing or updating authentication
- Managing secrets and environment variables
- Preventing injection attacks and XSS
- Hardening API endpoints
- Securing database connections

## Procedure

### Phase 1: Authentication Hardening

CampusOS uses JWT authentication:
- JWT via `jwt-authenticator.js` — uses `jsonwebtoken` library
- Algorithm: HS256
- Default expiry: 15 minutes (`JWT_EXPIRES_IN`)
- **Password hashing uses `node:crypto` scrypt** — not bcrypt
- Timing-safe comparison: `crypto.timingSafeEqual()`
- Token stored client-side via `lib/auth-session.ts` (`localStorage`)

### Phase 2: Secrets Management

```bash
# Setup
cp .env.example .env.local  # gitignored

# Required variables
MONGODB_URI=mongodb://localhost:27017/campusos
JWT_SECRET=<random-32-byte-hex>
FRONTEND_URLS=http://localhost:3000
```

Rules:
- Never commit `.env` files
- Never hardcode secrets in code
- Different secrets per environment
- `JWT_SECRET` required in production (crashes if missing)

### Phase 3: Input Validation

- **Auth module**: Custom validators in `schema/auth.schema.js`
- **Event module**: Custom validators in `schema/event.schema.js`
- **Operations modules**: Mongoose schema validation (required, enums, types)
- **Frontend**: Zod schemas in `lib/validations/`
- Controllers extract specific fields — never spread `req.body`

### Phase 4: CORS & Headers

- CORS configured via `FRONTEND_URLS` env var (comma-separated origins)
- `x-powered-by` header disabled: `app.disable('x-powered-by')`
- `express.json({ limit: '10mb' })` for payload size limit

### Phase 5: RBAC

```javascript
const requireRoles = registry.getService('requireRoles');
app.delete('/api/v1/vendors/:id', requireRoles('admin'), controller.delete);
```

Valid roles: `admin`, `coordinator`, `volunteer`
- `user` role exists in schema but is rejected by `requireRoles()`
- First signup gets `admin` role automatically

## Quick Reference

```bash
# Generate JWT secret
node -e "import('node:crypto').then(c => console.log(c.randomBytes(32).toString('hex')))"

# Check for exposed secrets
git log -p | grep -i "password\|token\|secret"

# Security audit
pnpm audit
```

## Common Issues

| Issue | Solution |
|-------|----------|
| JWT token invalid | Verify `JWT_SECRET` matches signing key |
| 401 on valid token | Check `Authorization: Bearer <token>` format |
| CORS blocked | Add origin to `FRONTEND_URLS` env var |
| Secrets in logs | Never log passwords, tokens, or PII |

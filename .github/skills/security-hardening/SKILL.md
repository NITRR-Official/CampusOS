---
name: security-hardening
description: 'OWASP vulnerabilities, authentication hardening, encryption, secrets management. Use when: implementing auth, encrypting data, managing environment variables, preventing injection/XSS, hardening endpoints.'
argument-hint: 'feature-type, auth-method, data-sensitivity'
---

# Security Hardening

## When to Use

- Implementing or updating authentication systems
- Encrypting sensitive data fields
- Managing API secrets and environment variables
- Preventing injection attacks and XSS
- Hardening API endpoints
- Securing database connections

## What This Skill Does

Applies OWASP security principles to CampusOS backend and frontend, covering authentication flows, data encryption, secret management, input validation, and vulnerability prevention.

## Procedure

### Phase 1: Authentication Hardening

1. Use JWT with strong `HS256` or `RS256` algorithms
2. Store tokens in httpOnly cookies (not localStorage)
3. Set short expiry times (15min access, 7day refresh)
4. Validate token signature and expiry on every protected route
5. Implement password hashing with bcrypt (salt rounds: 12)
6. Never store plaintext passwords in database

### Phase 2: Secrets Management

1. Use `.env.local` (git-ignored) for local development
2. Define all secrets in environment variables:
   - `DB_PASSWORD`, `JWT_SECRET`, `API_KEYS`
3. Load via `process.env` in backend, never expose to frontend
4. Use separate secrets for dev/staging/production
5. Rotate sensitive keys monthly
6. Never commit `.env` files or API keys

### Phase 3: Data Encryption

1. Encrypt PII fields: email (optional), phone, SSN
2. Use `crypto` module or `argon2` for hashing
3. Encrypt at rest: sensitive MongoDB fields
4. Use HTTPS/TLS for all data in transit
5. Include encryption metadata (algorithm, salt) in database
6. Implement key rotation strategy

### Phase 4: Input Validation & Sanitization

1. Validate all request inputs against schema (Zod/Joi)
2. Sanitize strings to prevent XSS: strip HTML tags
3. Use parameterized queries for MongoDB (prevent injection)
4. Whitelist allowed characters/formats per field
5. Reject oversized payloads (>10MB)
6. Log validation failures for monitoring

### Phase 5: CORS & Headers Security

1. Set CORS whitelist: `ALLOWED_ORIGINS` env var
2. Add security headers:
   - `Content-Security-Policy: default-src 'self'`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Strict-Transport-Security: max-age=31536000`
3. Disable `X-Powered-By` header
4. Set `SameSite=Strict` on cookies
5. Implement CSRF tokens for state-changing requests

### Phase 6: Rate Limiting & DDoS Protection

1. Install `express-rate-limit`
2. Rate limit login: 5 attempts / 15 minutes
3. Rate limit API: 100 requests / minute per IP
4. Block suspicious patterns (rapid requests)
5. Use Redis for distributed rate limiting
6. Return 429 (Too Many Requests) when exceeded

## Quick Reference

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Hash password test
npm ls bcrypt  # verify installed

# Check for exposed secrets
pnpm add --save-dev git-secrets
git-secrets --install

# Environment setup
cp .env.example .env.local
# Edit .env.local with secrets

# Validate JWT token
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.verify(process.env.TEST_TOKEN, process.env.JWT_SECRET))"

# OWASP dependency check
pnpm add --save-dev snyk
pnpm exec snyk test
```

## Troubleshooting

| Issue                           | Solution                                                                |
| ------------------------------- | ----------------------------------------------------------------------- |
| JWT token invalid               | Verify `JWT_SECRET` matches signing key; check token expiry             |
| 401 Unauthorized on valid token | Ensure Bearer token format in Authorization header                      |
| Password not hashing correctly  | Verify bcrypt salt rounds = 12; check password length                   |
| Secrets exposed in logs         | Scan logs with `grep -r "password\|token\|secret"; redact in logging`   |
| CORS blocked requests           | Add origin to `ALLOWED_ORIGINS`; verify `credentials: true` in frontend |
| Rate limiting not working       | Verify Redis running; check `NODE_ENV` matches config                   |

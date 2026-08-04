# Security Guidelines

Security practices for CampusOS, based on the actual implementation.

## Authentication

### How JWT Auth Works

1. User logs in via `POST /api/v1/auth/login`
2. Server returns `{ accessToken, tokenType: "Bearer", user }`
3. Frontend stores token in `localStorage` (key: `campusos.auth-session`)
4. Every subsequent request includes `Authorization: Bearer <token>`
5. `middleware/auth.js` verifies the token and sets `req.user`

### JWT Configuration

| Setting        | Value                                | Source                              |
| -------------- | ------------------------------------ | ----------------------------------- |
| Algorithm      | HS256                                | Hardcoded in `jwt-authenticator.js` |
| Default expiry | 15 minutes                           | `JWT_EXPIRES_IN` env var            |
| Secret         | Required in production               | `JWT_SECRET` env var                |
| Dev fallback   | `campus-os-dev-jwt-secret-change-me` | Only in non-production              |

**Important**: If `JWT_SECRET` is not set in production, the server will crash on startup with:

```
Error: JWT_SECRET environment variable is required in production
```

### Public Routes

These routes skip auth (from `middleware/auth.js`):

```
GET  /health
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/events           (event listing)
GET  /api/v1/events/:id       (single event)
POST /api/v1/events/:id/registrations
```

Everything else returns `401 Unauthorized` without a valid token.

## RBAC (Dynamic Atomic Access Control)

### Roles & Permissions

Roles in CampusOS are dynamically constructed from atomic permissions. Instead of checking if a user is an "admin", plugins check if the user has a specific atomic permission (e.g., `event:delete`).

> **Auto-admin**: The first user to sign up automatically gets the `owner` role, which grants the global `isSuperAdmin` bypass.

### How `requirePermissions()` works

`middleware/permissions.js` exports `requirePermissions()`, which verifies if the authenticated user has any of the requested atomic permissions, either globally or within a specific context (like a club).

```javascript
// middleware/permissions.js
export function requirePermissions(...allowedPermissions) {
  return async function permissionGuard(req, res, next) {
    // 1. Verifies JWT user context
    // 2. Checks global isSuperAdmin bypass
    // 3. Resolves dynamic context (e.g. Club) via registry.resolveContext
    // 4. Fetches user permissions within that context
    // 5. Checks if user possesses an allowed atomic permission
  };
}
```

Used in routes like:

```javascript
app.post(
  '/api/v1/vendors',
  requirePermissions('vendor:manage'),
  controller.create
);
app.delete(
  '/api/v1/vendors/:id',
  requirePermissions('vendor:delete'),
  controller.delete
);
```

## Secrets Management

### Rules

1. **Never commit `.env` files** — `.env` and `.env.local` are gitignored
2. **Use environment variables** — `process.env.JWT_SECRET`, `process.env.MONGODB_URI`
3. **Different secrets per environment** — Dev uses fallback, production requires real values
4. **Rotate `JWT_SECRET` periodically** — All existing tokens invalidate on change

### Required secrets

| Variable      | Required In | Notes                                              |
| ------------- | ----------- | -------------------------------------------------- |
| `JWT_SECRET`  | Production  | Server crashes without it                          |
| `MONGODB_URI` | Always      | Falls back to `mongodb://localhost:27017/campusos` |

## Password Security

Passwords are hashed using Node.js built-in `node:crypto` scrypt algorithm (not bcrypt):

```javascript
// In auth.service.js
const salt = crypto.randomBytes(16).toString('hex');
const derivedKey = await scryptAsync(password, salt, 64);
const hash = `${salt}:${derivedKey.toString('hex')}`;
```

- **Algorithm**: scrypt with 64-byte key length
- **Salt**: 16 random bytes per password
- **Storage format**: `salt:derivedKey` (hex encoded)
- **Comparison**: Uses `crypto.timingSafeEqual()` to prevent timing attacks

## Input Handling

### Request body size limits

Set in `app.js`:

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

### Validation approach

- **Backend (API Layer)**: We use **Zod** for schema validation on all incoming request bodies and queries (see ADR-010). The global `errorMiddleware` automatically catches `ZodError` exceptions thrown by controllers and translates them into standard `400 Bad Request` responses with field-level details.
- **Backend (Database Layer)**: Mongoose schemas enforce data integrity at the database level (required fields, enums, ObjectId refs).
- **Frontend**: Zod schemas combined with `react-hook-form` and `@hookform/resolvers/zod` provide identical client-side validation.
- Joi is completely deprecated and should not be used.

### Field extraction pattern

Controllers extract specific fields from `req.body` rather than passing the whole body:

```javascript
// Good — explicit field extraction
const { name, category, email, phone } = req.body;
const result = await service.create({ name, category, email, phone });

// This prevents unexpected fields from reaching the database
```

## CORS

Configured in `app.js`:

```javascript
const allowedOrigins = (
  process.env.FRONTEND_URLS ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000'
)
  .split(',')
  .map((origin) => origin.trim());
```

- Supports multiple origins via comma-separated `FRONTEND_URLS` env var
- Requests from unknown origins get a CORS error
- `credentials: true` allows cookies/auth headers

## Error Information Leakage

The error middleware (`middleware/error.js`) only includes stack traces in development:

```javascript
res.status(status).json({
  success: false,
  error: err.name || 'Error',
  message,
  requestId,
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
});
```

In production, only the error name and message are returned.

## Security Headers

- `x-powered-by` is disabled: `app.disable('x-powered-by')`
- No `helmet` middleware is currently installed

## Dependency Auditing

```bash
# Check for known vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

## PR Security Checklist

Before merging, verify:

- [ ] No hardcoded secrets, API keys, or passwords
- [ ] Protected endpoints have `requirePermissions()` guards (not `requireRoles`)
- [ ] Controller extracts specific fields (not `...req.body`)
- [ ] Error responses don't expose internal details
- [ ] New env vars are documented

---

**See Also**: [Backend Architecture](../architecture/BACKEND.md) · [API Standards](./API_STANDARDS.md) · [Code Review](./CODE_REVIEW.md)

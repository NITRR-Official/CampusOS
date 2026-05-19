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

## RBAC (Role-Based Access Control)

### Roles

Four roles defined in `user.schema.js`:

| Role          | Access                                                 |
| ------------- | ------------------------------------------------------ |
| `admin`       | Full access — CRUD on all resources, delete, approve   |
| `coordinator` | Create, update, assign — event and resource management |
| `volunteer`   | View and participate (default role for new users)      |
| `user`        | Basic access                                           |

> **Auto-admin**: The first user to sign up automatically gets the `admin` role (see `auth.service.js`). All subsequent users get `volunteer`.

### How `requireRoles()` works

`middleware/permissions.js` only checks against 3 roles (`admin`, `coordinator`, `volunteer`). The `user` role exists in the schema but is not listed in the `VALID_ROLES` set — a request from a `user`-role account will be rejected by `requireRoles()`.

```javascript
// middleware/permissions.js
export function requireRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);

  return function roleGuard(req, res, next) {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: 'User context missing' });
    }

    if (!allowed.has(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

Used in routes like:

```javascript
app.post(
  '/api/v1/vendors',
  requireRoles('admin', 'coordinator'),
  controller.create
);
app.delete('/api/v1/vendors/:id', requireRoles('admin'), controller.delete);
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

- **Auth module**: Custom validation functions in `schema/auth.schema.js` (not Mongoose, not Joi)
- **Event module**: Custom validation functions in `schema/event.schema.js`
- **Operations modules (Phase 5)**: Mongoose schema validation (required fields, enums, types)
- **Frontend**: Zod schemas in `lib/validations/` + react-hook-form
- Joi is listed as a backend dependency but is not actively used in current modules

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
- [ ] Protected endpoints have `requireRoles()` guards
- [ ] Controller extracts specific fields (not `...req.body`)
- [ ] Error responses don't expose internal details
- [ ] New env vars are documented

---

**See Also**: [Backend Architecture](../architecture/BACKEND.md) · [API Standards](./API_STANDARDS.md) · [Code Review](./CODE_REVIEW.md)

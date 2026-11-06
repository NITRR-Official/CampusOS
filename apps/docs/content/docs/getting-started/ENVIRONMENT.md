---
title: 'Environment Variables'
---

# Environment Variables

All configuration options for CampusOS, verified against the actual source code.

## Backend

Variables read in `backend/src/`:

| Variable             | Default                              | Read In                           | Description                                                           |
| -------------------- | ------------------------------------ | --------------------------------- | --------------------------------------------------------------------- |
| `PORT`               | `4000`                               | `index.js`                        | Backend server port                                                   |
| `NODE_ENV`           | `development`                        | `app.js`, `server.js`, `error.js` | Environment mode. Affects error stack traces, plugin failure handling |
| `JWT_SECRET`         | `campus-os-dev-jwt-secret-change-me` | `auth/jwt-authenticator.js`       | JWT signing key. **Crashes in production if not set**                 |
| `JWT_EXPIRES_IN`     | `15m`                                | `auth/jwt-authenticator.js`       | Token expiry duration (e.g., `15m`, `1h`, `7d`)                       |
| `MONGODB_URI`        | `mongodb://localhost:27017/campusos` | `database/connection.js`          | MongoDB connection string                                             |
| `FRONTEND_URLS`      | `http://localhost:3000`              | `app.js`                          | Comma-separated allowed CORS origins                                  |
| `FRONTEND_URL`       | `http://localhost:3000`              | `app.js`                          | Single allowed CORS origin (fallback if `FRONTEND_URLS` is not set)   |
| `ALLOW_PREVIEW_CORS` | _(not set)_                          | `app.js`                          | Set to `true` to allow any `*.vercel.app` origin (Preview env only)   |

### CORS Origin Resolution

The code in `app.js` resolves origins in this order:

```
FRONTEND_URLS  →  FRONTEND_URL  →  'http://localhost:3000'
```

Multiple origins can be specified as comma-separated values:

```bash
FRONTEND_URLS=http://localhost:3000,https://campusos.example.com
```

In non-production environments with `ALLOW_PREVIEW_CORS=true`, any `https://*.vercel.app` origin is also allowed. This enables PR preview deployments to access the backend without manual CORS configuration.

## Frontend

Variables read in `frontend/lib/`:

| Variable | Default | Read In | Description |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `lib/auth-api.ts`, `lib/vendor-api.ts`, etc. | Backend API URL for feature endpoints |

## Example `.env` Files

### Backend (root or `backend/`)

```bash
NODE_ENV=development
PORT=4000
JWT_SECRET=my-dev-secret
JWT_EXPIRES_IN=15m
MONGODB_URI=mongodb://localhost:27017/campusos
FRONTEND_URLS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Database Connection Options

### Local Development (no auth)

```bash
MONGODB_URI=mongodb://localhost:27017/campusos
```

### Docker with Authentication

```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/campusos?authSource=admin
```

### MongoDB Atlas (Cloud)

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campusos?retryWrites=true&w=majority
```

## Security Notes

- **Never commit `.env` files** — they are in `.gitignore`
- `JWT_SECRET` has a hardcoded dev fallback, but **the server will crash at startup** if not set in production
- The first user to sign up automatically gets the `admin` role
- Rotate `JWT_SECRET` periodically (all existing tokens invalidate)

---

## Deployment Environment Variables

CampusOS is designed to be **cloud-agnostic and container-ready**:

- **Frontend**: Built on **Next.js 16 (App Router)**. Because of this, **Vercel** provides the most streamlined zero-config deployment experience (especially for automated PR preview URLs). However, it can run anywhere Next.js is supported — including Docker (standalone output), AWS Amplify, Netlify, Cloudflare Pages, or any Node.js server.
- **Backend**: Standard **Express v5** service. It can be deployed on any PaaS (Render, Railway, Fly.io), container orchestrator (Docker, AWS ECS, GCP Cloud Run, Kubernetes), or traditional Linux virtual server (VPS with systemd/PM2).

### 1. Frontend Environment Variables

Set in your frontend hosting dashboard or production `.env` file:

| Variable              | Environment       | Description                                                              | Example / Recommended Value      |
| :-------------------- | :---------------- | :----------------------------------------------------------------------- | :------------------------------- |
| `NEXT_PUBLIC_API_URL` | **Production**    | Production backend API base URL                                          | `https://api.yourdomain.com`     |
| `NEXT_PUBLIC_API_URL` | **Staging / Dev** | Staging / Development backend API base URL                               | `https://dev-api.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | **Preview**       | PR Preview deployment API target (usually points to dev/staging backend) | `https://dev-api.yourdomain.com` |

### 2. Backend Environment Variables (Staging / Development)

For development or staging environments watching your `dev` branch:

| Variable             | Recommended Value                                   | Description                                                                                       |
| :------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `NODE_ENV`           | `development`                                       | Enables dev logging and verbose error details                                                     |
| `PORT`               | `10000` (or `4000`)                                 | Port the HTTP server listens on                                                                   |
| `MONGODB_URI`        | `mongodb+srv://...campusos-dev`                     | Staging MongoDB cluster connection string                                                         |
| `JWT_SECRET`         | `<your-dev-secret>`                                 | Secret string used to sign staging JWT tokens                                                     |
| `FRONTEND_URLS`      | `https://yourdomain.com,https://dev.yourdomain.com` | Comma-separated list of allowed frontend origins for CORS                                         |
| `ALLOW_PREVIEW_CORS` | `true`                                              | Allows dynamic preview origins (e.g. `*.vercel.app`) so PR preview builds can access staging APIs |

> [!NOTE] Dynamic Preview CORS
> If you use preview deployment workflows (such as Vercel Preview Deployments), frontend preview URLs change with every pull request. Setting `ALLOW_PREVIEW_CORS=true` allows preview origins to access the dev backend without manual CORS re-configuration.

### 3. Backend Environment Variables (Production)

For your production environment watching your `main` branch:

| Variable       | Recommended Value                | Description                                                                |
| :------------- | :------------------------------- | :------------------------------------------------------------------------- |
| `NODE_ENV`     | `production`                     | Enforces production optimizations, disables debug leaks                    |
| `PORT`         | `10000` (or `4000`)              | Port the HTTP server listens on                                            |
| `MONGODB_URI`  | `mongodb+srv://...campusos-prod` | Production MongoDB replica set URI with authentication                     |
| `JWT_SECRET`   | `<your-production-secret>`       | Cryptographically random secret string (required; server halts without it) |
| `FRONTEND_URL` | `https://yourdomain.com`         | Strict exact-match allowed CORS origin                                     |

> [!IMPORTANT] Production CORS Security
> The production backend does **not** enable `ALLOW_PREVIEW_CORS`. It enforces exact-match CORS via `FRONTEND_URL` to prevent cross-site request hijacking.

---

**See Also**: [Quick Start](./QUICK_START.md) · [Database Setup](./DATABASE_SETUP.md) · [CI/CD Guide](../guides/CI_CD.md) · [Security Guidelines](../guides/SECURITY.md)

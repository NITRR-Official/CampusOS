# Environment Variables

All configuration options for CampusOS, verified against the actual source code.

## Backend

Variables read in `backend/src/`:

| Variable         | Default                              | Read In                           | Description                                                           |
| ---------------- | ------------------------------------ | --------------------------------- | --------------------------------------------------------------------- |
| `PORT`           | `4000`                               | `index.js`                        | Backend server port                                                   |
| `NODE_ENV`       | `development`                        | `app.js`, `server.js`, `error.js` | Environment mode. Affects error stack traces, plugin failure handling |
| `JWT_SECRET`     | `campus-os-dev-jwt-secret-change-me` | `auth/jwt-authenticator.js`       | JWT signing key. **Crashes in production if not set**                 |
| `JWT_EXPIRES_IN` | `15m`                                | `auth/jwt-authenticator.js`       | Token expiry duration (e.g., `15m`, `1h`, `7d`)                       |
| `MONGODB_URI`    | `mongodb://localhost:27017/campusos` | `database/connection.js`          | MongoDB connection string                                             |
| `FRONTEND_URLS`  | `http://localhost:3000`              | `app.js`                          | Comma-separated allowed CORS origins                                  |
| `FRONTEND_URL`   | `http://localhost:3000`              | `app.js`                          | Single allowed CORS origin (fallback if `FRONTEND_URLS` is not set)   |

### CORS Origin Resolution

The code in `app.js` resolves origins in this order:

```
FRONTEND_URLS  →  FRONTEND_URL  →  'http://localhost:3000'
```

Multiple origins can be specified as comma-separated values:

```env
FRONTEND_URLS=http://localhost:3000,https://campusos.example.com
```

## Frontend

Variables read in `frontend/lib/`:

| Variable | Default | Read In | Description |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `lib/auth-api.ts`, `lib/vendor-api.ts`, etc. | Backend API URL for feature endpoints |

## Example `.env` Files

### Backend (root or `backend/`)

```env
NODE_ENV=development
PORT=4000
JWT_SECRET=my-dev-secret
JWT_EXPIRES_IN=15m
MONGODB_URI=mongodb://localhost:27017/campusos
FRONTEND_URLS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Database Connection Options

### Local Development (no auth)

```env
MONGODB_URI=mongodb://localhost:27017/campusos
```

### Docker with Authentication

```env
MONGODB_URI=mongodb://admin:password@localhost:27017/campusos?authSource=admin
```

### MongoDB Atlas (Cloud)

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campusos?retryWrites=true&w=majority
```

## Security Notes

- **Never commit `.env` files** — they are in `.gitignore`
- `JWT_SECRET` has a hardcoded dev fallback, but **the server will crash at startup** if not set in production
- The first user to sign up automatically gets the `admin` role
- Rotate `JWT_SECRET` periodically (all existing tokens invalidate)

---

**See Also**: [Quick Start](./QUICK_START.md) · [Database Setup](./DATABASE_SETUP.md) · [Security Guidelines](../guides/SECURITY.md)

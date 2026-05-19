# Quick Start

Get CampusOS running on your machine in under 5 minutes.

## Prerequisites

- **Node.js** v18.0.0 or higher
- **pnpm** v10.0.0 or higher (`npm install -g pnpm`)
- **Git**
- **MongoDB** — via Docker (recommended), native install, or [Atlas](https://cloud.mongodb.com)

## 1. Clone and Install

```bash
git clone https://github.com/NITRR-Official/CampusOS.git
cd CampusOS
pnpm install
```

## 2. Start MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

For other methods, see [Database Setup](./DATABASE_SETUP.md).

## 3. Start the Servers

```bash
# Terminal 1: Backend
cd backend && pnpm dev

# Terminal 2: Frontend
cd frontend && pnpm dev
```

You should see:
```
🚀 CampusOS Backend running on http://localhost:4000
📝 Environment: development
✅ MongoDB connected successfully
```

## 4. Open in Browser

- **Frontend**: http://localhost:3000
- **Backend health check**: http://localhost:4000/health

## Configuration (optional)

The defaults work out of the box. To customize, create `.env` in the project root:

```env
PORT=4000                                  # Backend port
JWT_SECRET=my-custom-secret                # JWT signing key (has dev fallback)
MONGODB_URI=mongodb://localhost:27017/campusos  # MongoDB connection string
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000   # Frontend → Backend URL
```

See [Environment Variables](./ENVIRONMENT.md) for all options.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on backend | MongoDB isn't running → `docker start mongodb` |
| Port 3000 or 4000 in use | Kill the process or change `PORT` in `.env` |
| `pnpm: command not found` | `npm install -g pnpm` |
| Dependencies out of date | `pnpm install` from root |

## Next Steps

- [Developer Onboarding](./DEVELOPER_ONBOARDING.md) — Make your first contribution
- [Architecture Overview](../architecture/OVERVIEW.md) — How the system works
- [Good first issues](https://github.com/NITRR-Official/CampusOS/issues?q=label%3Agood-first-issue)

---

**See Also**: [Developer Onboarding](./DEVELOPER_ONBOARDING.md) · [Database Setup](./DATABASE_SETUP.md) · [Environment Variables](./ENVIRONMENT.md)

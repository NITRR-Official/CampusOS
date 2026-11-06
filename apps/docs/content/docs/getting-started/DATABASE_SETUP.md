---
title: 'Database Setup (MongoDB)'
---

# Database Setup (MongoDB)

CampusOS uses MongoDB as its primary database. This guide covers three ways to get it running.

## Option 1: Docker (Recommended)

### Quick Start

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### With Authentication

```bash
docker run -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  --name mongodb \
  mongo:latest
```

```bash
# backend/.env
MONGODB_URI=mongodb://admin:password@localhost:27017/campusos?authSource=admin
```

### Docker Compose (Full Stack)

Create `docker-compose.yml` in the project root to run MongoDB, backend, and frontend together:

```yaml
version: '3'
services:
  mongodb:
    image: mongo:latest
    ports:
      - '27017:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - '4000:4000'
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/campusos?authSource=admin
      NODE_ENV: development
      PORT: 4000
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - '3000:3000'
    environment:
      NEXT_PUBLIC_API_URL: http://backend:4000
    depends_on:
      - backend

volumes:
  mongo_data:
```

```bash
docker compose up -d        # Start all services
docker compose logs -f      # View logs
docker compose down         # Stop all services
docker compose up -d --build  # Rebuild after code changes
```

## Option 2: Native Install

Install MongoDB Community Edition from the [official guide](https://www.mongodb.com/docs/manual/installation/), then start it:

```bash
mongod --dbpath /data/db
```

```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/campusos
```

## Option 3: MongoDB Atlas (Cloud)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Add your IP to the allowlist
3. Create a database user
4. Copy the connection string:

```bash
# backend/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campusos?retryWrites=true&w=majority
```

## Environment Configuration

Create `.env` in the `backend/` folder:

```bash
MONGODB_URI=mongodb://localhost:27017/campusos
NODE_ENV=development
PORT=4000
```

See [Environment Variables](./ENVIRONMENT.md) for all options.

## Database Collections

| Collection                 | Module / System                   | Purpose                                                     |
| :------------------------- | :-------------------------------- | :---------------------------------------------------------- |
| `users`                    | Auth (`auth`)                     | User accounts, credentials, and global roles                |
| `institutes`               | Institute (`institute`)           | Campus institute profiles and global settings               |
| `clubs`                    | Club (`club`)                     | Student organizations, councils, and clubs                  |
| `club_memberships`         | Club (`club`)                     | Member associations, roles, and status                      |
| `events`                   | Event (`event`)                   | Campus and club event management                            |
| `activities`               | Activity (`activity`)             | System-wide audit and activity event streams                |
| `checkins`                 | Checkin (`checkin`)               | QR-code event attendance and tickets                        |
| `forms`                    | Forms (`forms`)                   | Dynamic custom form schemas and fields                      |
| `form_submissions`         | Forms (`forms`)                   | User submissions to published forms                         |
| `tasks`                    | Task (`task`)                     | Department and event task assignments                       |
| `calendars`                | Calendar (`calendar`)             | Shared calendars and schedule feeds                         |
| `calendar_events`          | Calendar (`calendar`)             | Calendar time allocations                                   |
| `recruitment_campaigns`    | Recruitment (`recruitment`)       | Hiring campaigns and applications                           |
| `recruitment_applications` | Recruitment (`recruitment`)       | Candidate application submissions                           |
| `vendors`                  | Vendor (`vendor`)                 | External vendor records and contracts                       |
| `resources`                | Resource (`resource`)             | Equipment, halls, and inventory bookings                    |
| `timeslots`                | Scheduling (`scheduling`)         | Allocated venue and event time slots                        |
| `conflicts`                | Scheduling (`scheduling`)         | Detected room and equipment scheduling conflicts            |
| `budgets`                  | Budget (`budget`)                 | Event budgets and financial allocations                     |
| `expenses`                 | Budget (`budget`)                 | Line-item tracked expenses and receipts                     |
| `plugins`                  | Plugin Manager (`plugin-manager`) | Dynamic plugin states, capabilities, and trust              |
| `_plugin_migrations`       | Core Migration Runner             | Applied database migration checksums & run status (ADR-021) |

> [!NOTE] Fully Modular MongoDB Storage
> All 16 modular plugins (Activity, Admin, Auth, Budget, Calendar, Checkin, Club, Event, Forms, Institute, Plugin-Manager, Recruitment, Resource, Scheduling, Task, Vendor) are fully backed by MongoDB. Dynamic automated schema migrations are tracked in `_plugin_migrations`.

## Backups

```bash
# Backup
mongodump --uri="<connection-string>" --out=./backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="<connection-string>" ./backups/<date>/campusos
```

## Troubleshooting

| Problem                   | Fix                                                                 |
| ------------------------- | ------------------------------------------------------------------- |
| `ECONNREFUSED` on startup | MongoDB isn't running → `docker start mongodb`                      |
| Connection timeout        | Check `MONGODB_URI` in `.env`                                       |
| Auth failure (Atlas)      | Verify username/password and IP allowlist                           |
| Slow first test run       | `mongodb-memory-server` downloads binaries on first use — wait ~60s |

---

**See Also**: [Quick Start](./QUICK_START.md) · [Environment Variables](./ENVIRONMENT.md)

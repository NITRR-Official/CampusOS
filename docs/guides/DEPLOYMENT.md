# Deployment Guide

Docker setup, CI/CD pipeline, and production deployment for CampusOS.

## Local Development with Docker

### Docker Compose

Create a `docker-compose.yml` in the project root:

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
      NEXT_PUBLIC_API_BASE_URL: http://backend:4000
    depends_on:
      - backend

volumes:
  mongo_data:
```

### Running with Docker

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

## CI/CD Pipeline

### Pipeline Stages

```
1. Trigger   → On PR or push to main
2. Test      → Run test suite
3. Build     → Compile/bundle
4. Stage     → Deploy to staging
5. Verify    → Smoke tests
6. Produce   → Manual approval + deploy
```

### GitHub Actions Workflow

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test

  deploy-staging:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... deployment steps
```

## Pre-Deployment Checklist

Before deploying to any environment:

- [ ] All tests pass locally
- [ ] `pnpm audit` shows no critical vulnerabilities
- [ ] Environment variables configured
- [ ] Database migrations ready (if any)
- [ ] MongoDB connection verified
- [ ] Rollback plan documented
- [ ] Team notified

## Environment Configuration

### Staging

```env
NODE_ENV=staging
PORT=4000
MONGODB_URI=mongodb+srv://staging-user:password@cluster.mongodb.net/campusos-staging
JWT_SECRET=staging-secret-key
```

### Production

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/campusos
JWT_SECRET=<strong-production-secret>
```

## Rollback Strategy

### Quick Rollback

```bash
# Revert to previous deployment
git revert HEAD
git push origin main
# CI/CD will auto-deploy the reverted version
```

### Database Rollback

```bash
# Restore from backup
mongorestore --uri="<connection-string>" ./backups/campusos
```

## Monitoring

### Health Check Endpoint

```
GET /health
→ { "success": true, "status": "healthy", "timestamp": "2026-05-19T10:00:00.000Z" }
```

### Key Metrics to Monitor

- API response time (target: < 100ms median)
- Error rate (target: < 0.1%)
- Database connection pool usage
- Memory and CPU usage
- Request throughput

## Database Backups

```bash
# Manual backup
mongodump --uri="<connection-string>" --out=./backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="<connection-string>" ./backups/<date>/campusos
```

---

**See Also**: [Database Setup](../getting-started/DATABASE_SETUP.md) · [Environment Variables](../getting-started/ENVIRONMENT.md) · [Security Guidelines](./SECURITY.md)

---
name: deployment-docker
description: "Docker images, container setup, Docker Compose, multi-stage builds for CampusOS. Use when containerizing the app, setting up Docker Compose, building images, or deploying containers."
---

# Deployment Docker

## When to Use

- Building Docker images for backend/frontend
- Setting up multi-container local development
- Pushing images to container registry
- Optimizing image sizes

## Procedure

### Phase 1: Backend Dockerfile (Express on port 4000)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/apps ./apps
COPY package.json ./
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "backend/src/index.js"]
```

**Important**: Backend runs on port **4000**, not 3000.

### Phase 2: Frontend Dockerfile (Next.js on port 3000)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN cd frontend && pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Phase 3: Docker Compose

```yaml
services:
  backend:
    build: { context: ., dockerfile: Dockerfile }
    ports: ['4000:4000']
    environment:
      MONGODB_URI: mongodb://mongo:27017/campusos
      JWT_SECRET: ${JWT_SECRET}
    depends_on: [mongo]
  frontend:
    build: { context: ., dockerfile: Dockerfile.frontend }
    ports: ['3000:3000']
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:4000
    depends_on: [backend]
  mongo:
    image: mongo:7
    ports: ['27017:27017']
    volumes: ['mongo-data:/data/db']
volumes:
  mongo-data:
```

### Phase 4: .dockerignore

```
node_modules
.next
.git
.env
.env.local
coverage
```

## Quick Reference

```bash
docker compose up --build         # Build and start all
docker compose logs -f backend    # View backend logs
docker compose down -v            # Stop and remove volumes
docker compose exec backend sh    # Shell into backend
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Container crashes | Check logs: `docker compose logs backend` |
| DB connection refused | Ensure `depends_on: [mongo]`; wait for startup |
| Port conflict | Change ports in compose file |
| Image too large | Use Alpine base, multi-stage build, .dockerignore |

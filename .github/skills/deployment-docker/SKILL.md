---
name: deployment-docker
description: 'Docker images, container setup, Docker Compose, multi-stage builds, registry deployment. Use when: containerizing app, setting up Docker Compose, building images, pushing to registry.'
argument-hint: 'service-type, registry'
---

# Deployment Docker

## When to Use

- Building Docker images for backend/frontend
- Setting up multi-container local development with Docker Compose
- Pushing images to container registry
- Optimizing image sizes
- Managing environment configuration in containers
- Deploying containers to production

## What This Skill Does

Creates production-ready Docker images and Compose configurations for CampusOS backend (Express), frontend (Next.js), and database (MongoDB).

## Procedure

### Phase 1: Backend Dockerfile (Express)

1. Create `Dockerfile` in project root:

   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN corepack enable && pnpm install --frozen-lockfile
   COPY . .
   RUN pnpm build

   FROM node:20-alpine
   WORKDIR /app
   RUN corepack enable
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/dist ./dist
   COPY package.json ./
   EXPOSE 3000
   CMD ["node", "dist/index.js"]
   ```

2. Use Alpine base image (smaller, ~150MB vs 900MB)
3. Multi-stage build (builder stage discarded)
4. Copy only production dependencies to final image
5. Set proper `NODE_ENV=production`
6. Expose port from env: `${PORT:-3000}`

### Phase 2: Frontend Dockerfile (Next.js)

1. Create standalone `Dockerfile.nextjs`:

   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN corepack enable && pnpm install --frozen-lockfile
   COPY . .
   RUN pnpm build

   FROM node:20-alpine
   WORKDIR /app
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/public ./public
   EXPOSE 3001
   CMD ["node", "server.js"]
   ```

2. Use Next.js standalone mode in `next.config.js`:
   ```js
   module.exports = { output: 'standalone' };
   ```
3. Build generates `.next/standalone` with minimal dependencies
4. Public files must be copied separately
5. Expose frontend port (typically 3001)
6. Health check endpoint: `curl http://localhost:3001`

### Phase 3: Docker Compose Configuration

1. Create `docker-compose.yml`:
   ```yaml
   version: '3.9'
   services:
     backend:
       build: { context: ., dockerfile: Dockerfile }
       ports: ['3000:3000']
       environment:
         DB_URL: mongodb://mongo:27017/campusos
         JWT_SECRET: ${JWT_SECRET}
       depends_on: [mongo]
     frontend:
       build: { context: ./apps/web, dockerfile: ../Dockerfile.nextjs }
       ports: ['3001:3001']
       environment:
         NEXT_PUBLIC_API_URL: http://backend:3000
       depends_on: [backend]
     mongo:
       image: mongo:7-alpine
       ports: ['27017:27017']
       volumes: ['mongo-data:/data/db']
   volumes:
     mongo-data:
   ```
2. Define all services (backend, frontend, database)
3. Use service names for internal networking
4. Expose necessary ports to host
5. Mount volumes for data persistence
6. Use environment variable substitution: `${VAR_NAME}`

### Phase 4: Image Build & Optimization

1. Build backend: `docker build -t campusos-backend:v1.0.0 .`
2. Build frontend: `docker build -f Dockerfile.nextjs -t campusos-web:v1.0.0 ./apps/web`
3. Optimize image size:
   - Use Alpine base (not Ubuntu)
   - Remove dev dependencies in final stage
   - Use `.dockerignore` to exclude node_modules, .git, etc.
4. Verify image size: `docker images | grep campusos`
5. Tag with version and registry: `campusos-backend:v1.0.0`
6. Create `.dockerignore`:
   ```
   node_modules
   .next
   .git
   .env
   dist
   coverage
   ```

### Phase 5: Registry & Deployment

1. Login to registry: `docker login ghcr.io` (GitHub Container Registry)
2. Tag image for registry: `docker tag campusos-backend:v1.0.0 ghcr.io/user/campusos-backend:v1.0.0`
3. Push to registry: `docker push ghcr.io/user/campusos-backend:v1.0.0`
4. Deploy from registry: Update `docker-compose.yml` to use pushed image
5. Verify pull: `docker pull ghcr.io/user/campusos-backend:v1.0.0`
6. Set registry credentials in CI/CD secrets

### Phase 6: Local Development & Testing

1. Start all services: `docker-compose up -d`
2. View logs: `docker-compose logs -f backend`
3. Run migrations: `docker-compose exec backend pnpm migrate`
4. Access database: `docker exec -it campusos-mongo mongosh`
5. Rebuild after code change: `docker-compose up -d --build`
6. Clean up: `docker-compose down -v` (removes volumes)

## Quick Reference

```bash
# Build and run via Compose
docker-compose up --build

# Build single service
docker build -t campusos-backend:latest .

# Tag for registry
docker tag campusos-backend:latest ghcr.io/myorg/campusos-backend:latest

# Push to registry
docker push ghcr.io/myorg/campusos-backend:latest

# Run container with env file
docker run --env-file .env.local -p 3000:3000 campusos-backend:latest

# View image layers
docker history campusos-backend:latest

# Prune unused images/containers
docker system prune -a
```

## Troubleshooting

| Issue                          | Solution                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------ |
| Image build fails, "not found" | Verify Dockerfile path; check COPY source paths exist                          |
| Container starts but crashes   | Check logs: `docker-compose logs backend`                                      |
| Port already in use            | Change port in docker-compose.yml or: `docker stop $(docker ps -q)`            |
| Database connection refused    | Verify `depends_on: [mongo]` order; wait for mongo startup (~5s)               |
| .env variables not loaded      | Ensure `.env.local` exists; use `--env-file` or `environment:` in compose      |
| Image size too large (>500MB)  | Use Alpine base, multi-stage build, exclude unnecessary files in .dockerignore |

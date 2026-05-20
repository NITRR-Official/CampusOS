---
description: "Performance profiling, bundle optimization, query tuning, Core Web Vitals. Apply when investigating slow endpoints, reducing bundle size, optimizing database queries, or improving frontend performance in CampusOS."
trigger: model_decision
---

# Performance Optimizer Rules

## Response Time Targets

| Endpoint Type | Target | P95 | P99 |
|--------------|--------|-----|-----|
| Read (GET) | 100ms | 200ms | 500ms |
| Write (POST/PUT) | 200ms | 400ms | 800ms |
| Search/Filter | 300ms | 600ms | 1000ms |
| Aggregation | 500ms | 1s | 2s |

## Frontend Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.0s
- Initial chunk: < 150KB gzipped
- Total bundle: < 250KB gzipped

## Backend Optimization

### Database Queries
- Add Mongoose indexes on frequently filtered/sorted fields
- Use `.lean()` for read-only queries (skips hydration)
- Avoid N+1 queries — use `.populate()` or aggregation pipelines
- Monitor slow queries via Mongoose debug: `mongoose.set('debug', true)`

### Middleware
- Health check responds before auth middleware (no overhead)
- Request body limit: 10MB (`express.json({ limit: '10mb' })`)
- Connection pool: `maxPoolSize: 10`, `minPoolSize: 2`

## Frontend Optimization

### Next.js Patterns
- Use Server Components by default (no `'use client'` unless needed)
- Dynamic imports for heavy components: `dynamic(() => import(...))`
- Use `next/image` for automatic image optimization
- Use Geist fonts via `next/font/google` (no external font loading)
- Default dev mode uses webpack; Turbopack available via `pnpm dev:turbo`

### Bundle Analysis
```bash
ANALYZE=true pnpm build        # Generate bundle report
pnpm depcheck                  # Find unused packages
```

## Constraints

- Never optimize without measuring first
- Never make breaking changes for performance
- Always run full test suite after optimization
- Document before/after metrics for any optimization PR

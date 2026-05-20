---
name: performance-monitoring
description: "Performance metrics, SLAs, dashboards, latency tracking for CampusOS. Use when tracking service metrics, setting SLOs, monitoring latency, or identifying bottlenecks."
---

# Performance Monitoring

## When to Use

- Tracking response times and throughput
- Monitoring resource usage
- Setting performance budgets
- Identifying performance degradation

## Procedure

### Phase 1: Performance Targets

**Backend Response Times:**

| Endpoint Type | Target | P95 | P99 |
|--------------|--------|-----|-----|
| Read (GET) | 100ms | 200ms | 500ms |
| Write (POST) | 200ms | 400ms | 800ms |
| Search | 300ms | 600ms | 1000ms |
| Aggregation | 500ms | 1s | 2s |

**Frontend Core Web Vitals:**
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1
- TTI: < 3.0s

**Bundle Size:**
- Initial chunk: < 150KB gzipped
- Total: < 250KB gzipped

### Phase 2: Backend Monitoring

The request logger middleware tracks per-request timing:
- Method, path, status code, duration in ms
- Use `req.id` to trace slow requests

Monitor database performance:
```javascript
mongoose.set('debug', true);  // Log all queries with timing
```

Connection pool settings to watch:
- `maxPoolSize: 10`, `minPoolSize: 2`
- `serverSelectionTimeoutMS: 5000`
- `socketTimeoutMS: 45000`

### Phase 3: Frontend Monitoring

```bash
# Bundle analysis
ANALYZE=true pnpm build

# Lighthouse audit
npx lighthouse http://localhost:3000 --output=json

# Find unused packages
npx depcheck
```

### Phase 4: Load Testing

```bash
# Install autocannon for load testing
pnpm add -D autocannon

# Test backend endpoint
npx autocannon http://localhost:4000/api/v1/vendors -c 100 -d 60
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Slow endpoint | Check MongoDB indexes; use `.lean()` for read queries |
| High memory usage | Check for event listener leaks; monitor `process.memoryUsage()` |
| Bundle too large | Dynamic imports for below-fold components; tree-shake unused deps |
| Poor Lighthouse score | Optimize images with `next/image`; preload fonts |

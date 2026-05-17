---
name: performance-profiling
description: 'Profile and optimize CampusOS performance. Use when: investigating slow pages, reducing bundle size, optimizing memory usage, improving Lighthouse scores.'
---

# Performance Profiling

## When to Use

- Page loads slowly
- Bundle size exceeds budget
- Memory usage increasing
- CPU usage spikes
- Lighthouse score below target
- Optimizing for Core Web Vitals

## Procedure

### 1. Bundle Analysis

Analyze JavaScript composition:

```bash
# Generate bundle analyzer report
ANALYZE=true pnpm build

# Check dist/.next/analyze/client.html
# Look for: duplicates, unused libs, large packages
```

### 2. Memory Profiling

Identify memory leaks:

```bash
# Run with Node inspector
node --inspect=9229 dist/server.js

# In Chrome: chrome://inspect
# Take heap snapshots before/after operations
# Look for: growing heap, leaked listeners, circular refs
```

### 3. CPU Profiling

Identify hot functions:

```bash
# Profile with Node profiler
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Manual timing
const start = Date.now();
await operation();
console.log(`${Date.now() - start}ms`);
```

### 4. Lighthouse & Core Web Vitals

```bash
# Local audit
npm install -g lighthouse
lighthouse http://localhost:3000 --output=json

# Track metrics
pnpm next:metrics
```

### 5. Image & Asset Optimization

```tsx
import Image from 'next/image';

export function Hero({ src }) {
  return (
    <Image
      src={src}
      alt="Hero"
      width={1200}
      height={600}
      priority
      placeholder="blur"
    />
  );
}
```

### 6. Optimization Workflow

```bash
# 1. Baseline
pnpm build && ANALYZE=true pnpm build

# 2. Optimize (remove unused deps, code split, optimize images)

# 3. Measure improvement
# Compare bundle sizes and timings
```

## Quick Reference

```bash
pnpm build                    # Production build
ANALYZE=true pnpm build      # Bundle analysis
pnpm lighthouse              # Performance audit
pnpm depcheck                # Unused packages
NODE_OPTIONS="--inspect" pnpm dev   # Profile in dev
```

## Common Issues

| Issue                    | Solution                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Bundle size increased    | Use `pnpm why <pkg>` find dupes. Dynamic imports for routes.                          |
| Lighthouse score dropped | Check images (LCP), JS (TBT), layout shift (CLS). Use DevTools.                       |
| Memory leak              | Close DB connections in tests. Check setInterval/setTimeout. Use --detectOpenHandles. |
| Slow queries             | Add indexes. Use EXPLAIN. Check N+1 queries.                                          |
| Build time high          | Use esbuild. Dynamic imports. Cache aggressively.                                     |
| Core Web Vitals high     | Prioritize images. Stream SSR. Preload fonts.                                         |

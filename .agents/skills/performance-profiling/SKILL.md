---
name: performance-profiling
description: "Profile and optimize CampusOS performance. Use when investigating slow pages, reducing bundle size, optimizing memory usage, or improving Lighthouse scores."
---

# Performance Profiling

## When to Use

- Page loads slowly
- Bundle size exceeds budget
- Memory usage increasing
- Lighthouse score below target

## Procedure

### 1. Bundle Analysis

```bash
ANALYZE=true pnpm build
# Check build output for large chunks
# Look for duplicates, unused libs, large packages
```

### 2. Memory Profiling

```bash
node --inspect=9229 backend/src/index.js
# In Chrome: chrome://inspect
# Take heap snapshots before/after operations
```

### 3. Database Query Profiling

```javascript
// Enable Mongoose debug logging
mongoose.set('debug', true);

// Use .lean() for read-only queries (skip hydration)
const vendors = await Vendor.find({ status: 'active' }).lean();

// Add indexes for frequently filtered fields
vendorSchema.index({ category: 1, status: 1 });
```

### 4. Frontend Profiling

```bash
npx lighthouse http://localhost:3000 --output=json
```

Next.js optimizations:
- Use `next/image` for automatic image optimization
- Dynamic imports for heavy components
- Server Components by default (no `'use client'` unless needed)
- Geist fonts via `next/font/google` (no external font loading)

### 5. Optimization Workflow

```bash
# 1. Baseline
pnpm build

# 2. Identify bottleneck (bundle, query, memory)

# 3. Optimize

# 4. Measure improvement
pnpm build  # Compare output sizes
```

## Quick Reference

```bash
pnpm build                    # Production build
ANALYZE=true pnpm build       # Bundle analysis
npx depcheck                  # Unused packages
NODE_OPTIONS="--inspect" pnpm dev  # Profile in dev
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Bundle increased | `pnpm why <pkg>` for dupes; dynamic imports for routes |
| Slow queries | Add indexes; use `.lean()`; check N+1 queries |
| Memory leak | Close DB connections in tests; check setInterval |
| Build time high | Use Next.js webpack (default); cache aggressively |

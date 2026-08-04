---
name: testing-strategy
description: "Vitest test framework, mongodb-memory-server, service testing patterns for CampusOS. Use when writing unit tests, setting up test infrastructure, creating test fixtures, or planning test coverage."
---

# Testing Strategy

## When to Use

- Writing unit or integration tests
- Setting up test infrastructure for a new module
- Creating test fixtures and data factories
- Improving test coverage

## Procedure

### Phase 1: Test Framework Setup

CampusOS uses **Vitest** (not Jest) with **mongodb-memory-server**.

Each module has its own `vitest.config.js`:
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    fileParallelism: false
  }
});
```

### Phase 2: Test File Structure

Tests co-locate with source code:
```
plugins/<module>/src/service/
├── module.service.js       # Service implementation
└── module.service.test.js  # Tests
```

### Phase 3: Test Setup Pattern

```javascript
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../../../../backend/src/database/connection.js';
import { Vendor } from '../../../../backend/src/database/schemas/vendor.schema.js';
import { VendorService } from './vendor.service.js';

describe('VendorService', () => {
  let service;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  }, 120000);

  beforeEach(async () => {
    await Vendor.deleteMany({});
    service = new VendorService();
  });
});
```

### Phase 4: Writing Tests

Test service methods directly — not HTTP routes:

```javascript
it('should create vendor with valid data', async () => {
  const result = await service.createVendor({
    name: 'Catering Co',
    category: 'catering',
    email: 'info@catering.co',
    phone: '555-0100',
    contactPerson: 'Alice'
  });
  expect(result.success).toBe(true);
  expect(result.vendor.name).toBe('Catering Co');
});

it('should fail with missing required fields', async () => {
  const result = await service.createVendor({});
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});

it('should fail with invalid enum value', async () => {
  const result = await service.createVendor({
    name: 'Test',
    category: 'invalid-category',
    email: 'test@test.com',
    phone: '555-0100',
    contactPerson: 'Bob'
  });
  expect(result.success).toBe(false);
});
```

### Phase 5: Coverage

Run with coverage per module:
```bash
pnpm -C plugins/vendor test -- --coverage
```

Targets:
- Service methods: > 80%
- Business logic: > 85%
- Utilities: > 90%

## Quick Reference

```bash
# Run single module tests
pnpm -C plugins/vendor test -- --run

# Watch mode
pnpm -C plugins/vendor test

# With coverage
pnpm -C plugins/vendor test -- --coverage

# Run all module tests
pnpm -C plugins/vendor test -- --run && pnpm -C plugins/resource test -- --run
```

## Current Test Suite

| Module | Tests | Status |
|--------|-------|--------|
| Vendor | 14 | ✅ |
| Resource | 16 | ✅ |
| Scheduling | 14 | ✅ |
| Budget | 21 | ✅ |
| **Total** | **65** | ✅ |

## Common Issues

| Issue | Solution |
|-------|----------|
| MongoMemoryServer download timeout | Increase `testTimeout` to 120000 in config |
| Tests interfere with each other | `beforeEach` must `deleteMany({})` for isolation |
| Connection leak | Always `disconnectDB()` + `mongoServer.stop()` in `afterAll` |
| Test passes alone, fails in suite | Check `fileParallelism: false` in vitest config |

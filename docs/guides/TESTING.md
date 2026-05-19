# Testing Guide

Testing patterns for CampusOS, based on the actual test suite.

## Test Framework

CampusOS uses **Vitest** with **mongodb-memory-server** for database tests.

## Where Tests Live

Tests sit alongside the code they test:

```
apps/<module>/src/service/
├── vendor.service.js           # Implementation
└── vendor.service.test.js      # Tests
```

Each module has its own `vitest.config.js` and `package.json` with test dependencies.

## Test Setup Pattern

Every test file that touches the database follows this structure:

```javascript
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '../../../../backend/src/database/connection.js';
import { Vendor } from '../../../../backend/src/database/schemas/vendor.schema.js';
import { VendorService } from './vendor.service.js';

describe('VendorService', () => {
  let service;
  let mongoServer;

  // Start in-memory MongoDB before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000); // 120s timeout for MongoDB download on first run

  // Stop MongoDB after all tests
  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }, 120000);

  // Clear data and create fresh service before each test
  beforeEach(async () => {
    await Vendor.deleteMany({});
    service = new VendorService();
  });

  // ... tests
});
```

Key things to notice:

- `MongoMemoryServer.create()` downloads and starts a real MongoDB instance in memory
- The `120000` timeout on `beforeAll`/`afterAll` handles the first-run binary download
- `beforeEach` clears all documents for test isolation
- Tests use the real `connectDB()` from the backend — same function production uses

## Writing Tests

### Test what services return

Services return `{ success: true, data }` or `{ success: false, error }`. Tests check these:

```javascript
it('should create a new vendor with all required fields', async () => {
  const vendorData = {
    name: 'Tech Supplies Co',
    category: 'technology',
    contactPerson: 'John Doe',
    email: 'john@techsupplies.com',
    phone: '+1234567890'
  };

  const result = await service.createVendor(vendorData);

  expect(result.success).toBe(true);
  expect(result.vendor).toBeDefined();
  expect(result.vendor.name).toBe('Tech Supplies Co');
  expect(result.vendor.status).toBe('active'); // default value
});
```

### Test failure paths

```javascript
it('should fail when missing required fields', async () => {
  const result = await service.createVendor({
    name: 'Incomplete Vendor',
    category: 'catering'
    // missing contactPerson, email, phone
  });

  expect(result.success).toBe(false);
  expect(result.error).toContain('Missing required fields');
});
```

### Test edge cases

```javascript
it('should reject rating above 5', async () => {
  const result = await service.rateVendor(vendorId, 6);

  expect(result.success).toBe(false);
  expect(result.error).toContain('between 0 and 5');
});

it('should return null for non-existent vendor', async () => {
  const result = await service.getVendorById('non-existent-id');
  expect(result).toBeNull();
});
```

### Test data integrity

```javascript
it('should generate unique IDs for vendors', async () => {
  const result1 = await service.createVendor(vendor1Data);
  const result2 = await service.createVendor(vendor2Data);

  expect(result1.vendor.id).not.toBe(result2.vendor.id);
});

it('should set timestamps on vendor creation', async () => {
  const beforeCreate = new Date();
  const result = await service.createVendor(vendorData);
  const afterCreate = new Date();

  expect(result.vendor.createdAt).toBeInstanceOf(Date);
  expect(result.vendor.createdAt.getTime()).toBeGreaterThanOrEqual(
    beforeCreate.getTime()
  );
});
```

## Running Tests

```bash
# Run all tests for a specific module
pnpm -C apps/vendor test

# Run with --run flag (exit after completion, no watch)
pnpm -C apps/vendor test -- --run

# Run with coverage
pnpm -C apps/vendor test -- --coverage

# Run a specific test file
pnpm -C apps/vendor test -- vendor.service.test.js
```

## Current Test Coverage

| Module     | Tests                                      | Status         |
| ---------- | ------------------------------------------ | -------------- |
| Vendor     | 14 tests (create, list, get, assign, rate) | ✅ Passing     |
| Resource   | 16 tests                                   | ✅ Passing     |
| Scheduling | 14 tests                                   | ✅ Passing     |
| Budget     | 21 tests                                   | ✅ Passing     |
| **Total**  | **65 tests**                               | ✅ All passing |

## What to Test

- ✅ **Service methods** — all CRUD operations
- ✅ **Validation** — missing fields, invalid data
- ✅ **Edge cases** — empty results, boundary values, duplicates
- ✅ **Data integrity** — IDs, timestamps, defaults
- ✅ **Multi-step operations** — assign vendor → get assignments

## What NOT to Test

- ❌ Express routing (the framework works)
- ❌ Mongoose internals
- ❌ Controller HTTP logic (test services instead)

## Troubleshooting

| Issue                                | Solution                                  |
| ------------------------------------ | ----------------------------------------- |
| `MongoMemoryServer` download timeout | Increase `beforeAll` timeout to `120000`  |
| "Connection already established"     | Check `beforeAll`/`afterAll` lifecycle    |
| Tests pass alone but fail together   | `beforeEach` should clear all collections |
| Flaky tests                          | Add `await` to all async operations       |

---

**See Also**: [Phase 5 Test Results](../phases/phase5/TEST_RESULTS.md) · [Code Review](./CODE_REVIEW.md) · [API Standards](./API_STANDARDS.md)

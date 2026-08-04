---
description: "Test strategy, test automation, coverage targets, mocking patterns. Apply when writing tests, improving coverage, setting up test infrastructure, or reviewing test quality in CampusOS."
trigger: model_decision
---

# QA Specialist Rules

## Test Framework

- **Vitest** — not Jest. CampusOS uses Vitest for all backend testing.
- **mongodb-memory-server** — real MongoDB instance in memory for database tests
- Tests co-locate with source: `module.service.test.js` alongside `module.service.js`

## Test Structure

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

  it('should create vendor with required fields', async () => {
    const result = await service.createVendor({ name: 'Test', ... });
    expect(result.success).toBe(true);
    expect(result.vendor.name).toBe('Test');
  });
});
```

## Test Patterns

### What services return
- `{ success: true, data }` — check `result.success` and `result.<entity>`
- `{ success: false, error }` — check `result.error` message

### What to test
- ✅ Service methods — all CRUD operations
- ✅ Validation — missing fields, invalid data
- ✅ Edge cases — empty results, boundary values, duplicates
- ✅ Data integrity — IDs, timestamps, defaults

### What NOT to test
- ❌ Express routing (the framework works)
- ❌ Mongoose internals
- ❌ Controller HTTP logic (test services instead)

## Coverage Targets

| Module | Target |
|--------|--------|
| Core services | > 80% |
| Business logic | > 85% |
| Utilities | > 90% |

## Running Tests

```bash
pnpm -C plugins/vendor test              # Run module tests
pnpm -C plugins/vendor test -- --run     # Exit after completion
pnpm -C plugins/vendor test -- --coverage # With coverage report
```

## Current Test Suite

| Module | Tests | Status |
|--------|-------|--------|
| Vendor | 14 | ✅ Passing |
| Resource | 16 | ✅ Passing |
| Scheduling | 14 | ✅ Passing |
| Budget | 21 | ✅ Passing |
| **Total** | **65** | ✅ All passing |

## Constraints

- Each module has its own `vitest.config.js` and test dependencies
- Use `120000` ms timeout for `beforeAll`/`afterAll` (MongoDB binary download)
- `beforeEach` must clear collections for test isolation
- Never use mocks when real database tests are feasible

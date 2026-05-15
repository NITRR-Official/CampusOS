# MongoDB Migration Guide

## Purpose

Describe the completed migration from in-memory Map storage to MongoDB for Phase 5 modules, including service changes and testing updates.

## Audience

Backend developers and maintainers who need to understand or reproduce the migration steps.

## Status

Migration complete; use this document as a reference for implementation details.

## Completed Setup

### Database Infrastructure
- [x] MongoDB connection manager (`backend/src/database/connection.js`)
- [x] Mongoose schemas for all 4 modules
- [x] Database indexes for query optimization
- [x] MongoDB-Memory-Server for testing
- [x] Backend initialization with DB connection

### Database Schemas Created

| Module | Schema Files | Collections |
|--------|--------------|-------------|
| Vendor | vendor.schema.js | vendors |
| Resource | resource.schema.js | resources |
| Scheduling | scheduling.schema.js | timeslots, conflicts |
| Budget | budget.schema.js | budgets, expenses |

### Files Created

```
backend/src/database/
├── connection.js (MongoDB connection manager)
├── migration-guide.js (Reference documentation)
└── schemas/
    ├── vendor.schema.js
    ├── resource.schema.js
    ├── scheduling.schema.js
    ├── budget.schema.js
    └── index.js (schema exports)

docs/
└── DATABASE_SETUP.md (Complete setup guide)

apps/vendor/src/service/
└── vendor.service.mongodb.js (Reference implementation)
```

## Service Migration Steps

### Step 1: Vendor Service Migration

**File to replace**: `apps/vendor/src/service/vendor.service.js`

**Current status**: Completed in `vendor.service.js` (reference retained in `vendor.service.mongodb.js`)

**Changes required**:
1. Import Vendor model: `import { Vendor } from '../../../backend/src/database/schemas/vendor.schema.js'`
2. Remove Map-based storage initialization
3. Make all methods async
4. Replace Map.set/get operations with MongoDB queries

**Key changes**:

```javascript
// Before (Map)
createVendor(vendorData) {
  this.#vendorStorage.set(id, vendor);
  return { success: true, vendor };
}

// After (MongoDB)
async createVendor(vendorData) {
  const vendor = new Vendor(vendorData);
  await vendor.save();
  return { success: true, vendor: vendor.toObject() };
}
```

**Methods to update**:
- `createVendor()` → use `new Vendor().save()`
- `getVendorById()` → use `Vendor.findById()`
- `getAllVendors()` → use `Vendor.find()` with filters
- `updateVendor()` → use `Vendor.findByIdAndUpdate()`
- `deleteVendor()` → use `Vendor.findByIdAndDelete()`
- `assignVendorToEvent()` → use array push with `$push` operator
- `rateVendor()` → use `$push` for ratings array, calculate average

**Testing**:
- Update vendor.service.test.js to use async/await
- Use mongodb-memory-server for test database
- Verify all 14 tests pass

### Step 2: Resource Service Migration

**File to replace**: `apps/resource/src/service/resource.service.js`

**Changes required**:
1. Import Resource model
2. Split Map storage (resource + allocations) into single Resource document
3. Make all methods async
4. Use MongoDB array operations for allocations

**Key considerations**:
- Allocations stored as array within Resource document
- Use `$push` to add allocations
- Use `$set` to update allocation status
- Use `availableQuantity` calculation

**Methods to update** (~10-15 methods):
- All CRUD operations
- Allocation management
- Conflict detection queries
- Availability calculations

### Step 3: Scheduling Service Migration

**File to replace**: `apps/scheduling/src/service/scheduling.service.js`

**Changes required**:
1. Import TimeSlot and Conflict models
2. Split Map storage into two collections
3. Make all methods async
4. Update conflict detection to query across documents

**Complex operations**:
- Venue availability checking (query overlapping time slots)
- Conflict detection (automatic creation of Conflict documents)
- Multi-step workflow for creating slots with conflict checking

### Step 4: Budget Service Migration

**File to replace**: `apps/budget/src/service/budget.service.js`

**Changes required**:
1. Import Budget and Expense models
2. Split storage into two collections
3. Make all methods async
4. Update aggregations using MongoDB

**Aggregation operations**:
- Total expenses calculation
- Category breakdown
- Budget vs actual comparison
- Payment status tracking

## Implementation Checklist

### Phase 1: Vendor Service (Start Here)
- [x] Copy `vendor.service.mongodb.js` approach to actual `vendor.service.js`
- [x] Update all 14 methods to use Vendor model
- [x] Add error handling for DB operations
- [x] Update vendor.service.test.js
  - [x] Use async/await
  - [x] Setup mongodb-memory-server
  - [x] Update all 14 test cases
  - [x] Run tests: `cd apps/vendor && pnpm test --run`
- [x] Update vendor controller to await service calls
- [x] Test with Postman/curl

### Phase 2: Resource Service
- [x] Create resource.service.mongodb.js template
- [x] Update all ~15 methods
- [x] Handle allocation array operations
- [x] Update resource.service.test.js
  - [x] Convert to async/await
  - [x] Update all 16 test cases
  - [x] Run tests: `cd apps/resource && pnpm test --run`
- [x] Update resource controller

### Phase 3: Scheduling Service
- [x] Create scheduling.service.mongodb.js template
- [x] Split into TimeSlot and Conflict models
- [x] Implement conflict detection queries
- [x] Update scheduling.service.test.js
  - [x] Convert to async/await
  - [x] Update all 14 test cases
  - [x] Run tests
- [x] Update scheduling controller

### Phase 4: Budget Service
- [x] Create budget.service.mongodb.js template
- [x] Split into Budget and Expense models
- [x] Implement aggregation queries
- [x] Update budget.service.test.js
  - [x] Convert to async/await
  - [x] Update all 21 test cases
  - [x] Run tests
- [x] Update budget controller

## Environment Setup

See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for environment configuration and local MongoDB setup.

## Testing Strategy

### Unit Tests with MongoDB Memory Server

```javascript
// In test setup
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDB(mongoServer.getUri());
});

afterAll(async () => {
  await disconnectDB();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear collections before each test
  await Vendor.deleteMany({});
});
```

### Running Tests

```bash
# All modules
cd backend && pnpm test --run

# Individual module
cd apps/vendor && pnpm test --run
cd apps/resource && pnpm test --run
cd apps/scheduling && pnpm test --run
cd apps/budget && pnpm test --run
```

## Controller Updates

### Before (Map-based sync)

```javascript
export const createVendor = (req, res) => {
  const vendor = service.createVendor(req.body);
  res.json(vendor);
};
```

### After (MongoDB async)

```javascript
export const createVendor = async (req, res, next) => {
  try {
    const vendor = await service.createVendor(req.body);
    res.json(vendor);
  } catch (error) {
    next(error); // Pass to error middleware
  }
};
```

## Error Handling

Add to error middleware for DB-specific errors:

```javascript
if (error.name === 'MongoError') {
  return res.status(400).json({ error: 'Database error' });
}

if (error.name === 'ValidationError') {
  return res.status(422).json({ error: 'Validation failed' });
}

if (error.name === 'CastError') {
  return res.status(400).json({ error: 'Invalid ID format' });
}
```

## Performance Tuning

### After Migration Complete

```javascript
// Add indexes if not auto-created
await Vendor.syncIndexes();
await Resource.syncIndexes();
await TimeSlot.syncIndexes();
await Budget.syncIndexes();

// Enable query optimization
await Vendor.find().explain('executionStats');
```

### Monitoring

```bash
# Connect to MongoDB and check
mongosh

# Switch database
use campusos

# Check indexes
db.vendors.getIndexes()

# Check collection stats
db.vendors.stats()
```

## Rollback Strategy

If issues arise:

1. Keep Map-based services running as separate versions
2. Use feature flags to switch between implementations
3. Backup data before migration
4. Test thoroughly with MongoDB Memory Server first

```javascript
// Feature flag example
const useMongoDBVendor = process.env.USE_MONGODB === 'true';
const VendorService = useMongoDBVendor ? VendorServiceMongo : VendorServiceMap;
```

## Deployment Considerations

### Before Deploying to Production

1. **Data Migration**: Export Map data, import to MongoDB
2. **Connection Pooling**: Verify maxPoolSize settings
3. **Backups**: Setup MongoDB backups
4. **Monitoring**: Setup error tracking
5. **Health Checks**: Verify DB connectivity

### Docker Compose for Development

```yaml
version: '3'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## Timeline Estimate

- **Vendor Service**: 2-3 hours (simplest, good reference)
- **Resource Service**: 3-4 hours (array operations complexity)
- **Scheduling Service**: 3-4 hours (conflict detection logic)
- **Budget Service**: 2-3 hours (aggregation queries)
- **Testing & Debugging**: 4-6 hours
- **Total**: ~14-20 hours

## Next Steps

1. Add CI/CD integration for test runs
2. Add API integration tests for controllers
3. Add health check endpoint and monitoring
4. Production deployment readiness

## Related Docs

- See [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md) for setup and operations.
- See [docs/phase5/README.md](docs/phase5/README.md) for Phase 5 documentation index.

# Database Setup & MongoDB Migration Guide

## Overview

Phase 5 modules (Vendor, Resource, Scheduling, Budget) have been migrated from in-memory Map storage to MongoDB for data persistence.

## Prerequisites

```bash
# MongoDB installed locally or running via Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (cloud)
# Connection string: mongodb+srv://username:password@cluster.mongodb.net/campusos
```

## Environment Setup

Create `.env` in the backend folder:

```env
MONGODB_URI=mongodb://localhost:27017/campusos
NODE_ENV=development
PORT=4000
```

## Database Architecture

### Collections

| Collection | Module | Purpose | Documents |
|-----------|--------|---------|-----------|
| vendors | Vendor | Store vendor information and assignments | VendorSchema |
| resources | Resource | Track equipment and inventory | ResourceSchema |
| timeslots | Scheduling | Store event time slots | TimeSlotSchema |
| conflicts | Scheduling | Track scheduling conflicts | ConflictSchema |
| budgets | Budget | Store event budgets | BudgetSchema |
| expenses | Budget | Track expenses | ExpenseSchema |

### Relationships

```
Event
├── Budget (1:1)
│   └── Expense (1:N)
├── TimeSlot (1:N)
│   └── Conflict (through venue/time overlap)
├── Resource Allocation (1:N)
│   └── Resource (N:M)
└── Vendor Assignment (1:N)
    └── Vendor (N:M)
```

## Schema Details

### Vendor Schema
```javascript
{
  name: String,
  category: String,
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  pricing: Object,
  ratings: [{rating, comment, ratedBy, ratedAt}],
  averageRating: Number,
  assignments: [{eventId, status, notes}],
  isActive: Boolean,
  timestamps
}
```

### Resource Schema
```javascript
{
  name: String,
  type: String (equipment|furniture|technology|consumable|other),
  quantity: Number,
  availableQuantity: Number,
  location: String,
  condition: String,
  lastMaintenanceDate: Date,
  allocations: [{allocationId, eventId, quantity, dates, status}],
  isActive: Boolean,
  timestamps
}
```

### TimeSlot Schema
```javascript
{
  eventId: String,
  venue: String,
  startTime: Date,
  endTime: Date,
  capacity: Number,
  resourcesAllocated: [{resourceId, quantity}],
  timestamps
}
```

### Conflict Schema
```javascript
{
  slotId1: String,
  slotId2: String,
  conflictType: String (venue|resource|time|capacity),
  severity: String,
  description: String,
  resolved: Boolean,
  resolution: String,
  timestamps
}
```

### Budget Schema
```javascript
{
  eventId: String,
  totalAllocation: Number,
  budgetBreakdown: [{category, amount}],
  currency: String,
  approvalStatus: String (draft|approved|rejected),
  approvedBy: String,
  approvedDate: Date,
  timestamps
}
```

### Expense Schema
```javascript
{
  budgetId: String,
  category: String,
  description: String,
  amount: Number,
  vendor: String,
  paymentMethod: String,
  paymentStatus: String (pending|paid|refunded),
  paidDate: Date,
  receipt: String,
  timestamps
}
```

## Migration Steps

### Phase A: Connection Setup
- [x] Install mongoose (v9.6.1)
- [x] Install mongodb-memory-server (for testing)
- [x] Create database/connection.js
- [x] Update backend/src/index.js to initialize DB

### Phase B: Schema Creation
- [x] Create vendor.schema.js
- [x] Create resource.schema.js
- [x] Create scheduling.schema.js
- [x] Create budget.schema.js
- [x] Add database indexes

### Phase C: Service Migration (Complete)

#### Vendor Service
**File**: `apps/vendor/src/service/vendor.service.js`

Changes:
1. Import Vendor model
2. Make all methods async
3. Replace `#vendorStorage.set(id, vendor)` with `new Vendor(data).save()`
4. Replace `#vendorStorage.get(id)` with `Vendor.findById(id)`
5. Replace array iteration with `Vendor.find(query)`
6. Update tests to use async/await

**Key methods to update**:
- `createVendor()` → use `Vendor.create()`
- `getAllVendors()` → use `Vendor.find()`
- `getVendorById()` → use `Vendor.findById()`
- `assignVendorToEvent()` → use `Vendor.updateOne()` with array push

#### Resource Service
**File**: `apps/resource/src/service/resource.service.js`

Changes:
1. Import Resource model
2. Make all methods async
3. Update allocation tracking to use array operations
4. Replace Map operations with Model operations

#### Scheduling Service
**File**: `apps/scheduling/src/service/scheduling.service.js`

Changes:
1. Import TimeSlot, Conflict models
2. Split Map storage into two collections
3. Make all methods async
4. Update conflict detection to query across documents

#### Budget Service
**File**: `apps/budget/src/service/budget.service.js`

Changes:
1. Import Budget, Expense models
2. Split storage into two collections
3. Make all methods async
4. Update expense aggregations to use MongoDB queries

### Phase D: Controller Updates (Complete)
- Update all controllers to await service calls
- Add error handling for DB operations

### Phase E: Test Updates (Complete)
- Update all service tests to use async/await
- Use mongodb-memory-server for testing
- Clear collections between tests

## Database Connection Options

### Local Development
```javascript
// .env
MONGODB_URI=mongodb://localhost:27017/campusos
```

### Docker
```bash
docker run -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  --name mongodb \
  mongo:latest
```

### MongoDB Atlas (Cloud)
```javascript
// .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campusos?retryWrites=true&w=majority
```

## Health Check Endpoint (Optional)

Add to backend routes:
```javascript
app.get('/health/db', async (req, res) => {
  const isConnected = await healthCheck();
  res.json({ 
    status: isConnected ? 'healthy' : 'unhealthy',
    database: 'mongodb'
  });
});
```

## Index Strategy

Indexes created for optimal query performance:

| Collection | Indexes |
|-----------|---------|
| vendors | category, email, assignments.eventId |
| resources | type, allocations.eventId, condition |
| timeslots | eventId, venue, startTime/endTime |
| conflicts | slotId1/slotId2, resolved |
| budgets | eventId (unique), approvalStatus |
| expenses | budgetId, category, paymentStatus |

## Data Backup Strategy

```bash
# Backup all collections
mongodump --uri="mongodb://localhost:27017/campusos" --out=./backups

# Restore
mongorestore --uri="mongodb://localhost:27017/campusos" ./backups/campusos
```

## Troubleshooting

### Connection Issues
```javascript
// Check connection
import { isDBConnected } from '@backend/database/connection'
console.log(isDBConnected()) // true/false
```

### Missing Indexes
```javascript
// Rebuild indexes
await Vendor.syncIndexes()
await Resource.syncIndexes()
```

## Performance Considerations

1. **Batch Operations**: Use `Model.insertMany()` for bulk inserts
2. **Lean Queries**: Use `.lean()` for read-only operations to reduce memory
3. **Connection Pooling**: Configured with maxPoolSize: 10
4. **Timeouts**: serverSelectionTimeout: 5s, socketTimeout: 45s

## Next Steps

1. ✅ Migrate all services to MongoDB
2. ✅ Update controllers to async/await
3. ✅ Update tests to use mongodb-memory-server
4. ✅ Verify CRUD operations and conflict scenarios
5. → Add `/health/db` endpoint for runtime checks
6. → Add CI/CD test execution and coverage reports

## Files Modified/Created

```
backend/src/
├── database/
│   ├── connection.js (NEW)
│   ├── migration-guide.js (NEW)
│   └── schemas/
│       ├── vendor.schema.js (NEW)
│       ├── resource.schema.js (NEW)
│       ├── scheduling.schema.js (NEW)
│       ├── budget.schema.js (NEW)
│       └── index.js (NEW)
├── index.js (MODIFIED - added DB connection)
└── ...
```

---

**Status**: Migration complete with updated services, controllers, and tests.
**Next**: Add health check, CI coverage, and production readiness steps.

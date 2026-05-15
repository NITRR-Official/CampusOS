# Database Setup (MongoDB)

## Purpose

Provide a single, consistent setup guide for MongoDB used by the Phase 5 modules (Vendor, Resource, Scheduling, Budget).

## Audience

Developers running CampusOS locally or in CI who need a working MongoDB connection and baseline operational guidance.

## Status

Migration complete; this document covers setup and operations. See the migration guide for step-by-step changes.

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

See the migration guide for the step-by-step implementation details, service changes, and test updates.

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

1. Add `/health/db` endpoint for runtime checks
2. Add CI/CD test execution and coverage reports

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

## Related Docs

- See [docs/MONGODB_MIGRATION.md](docs/MONGODB_MIGRATION.md) for migration steps and service-level details.
- See [docs/phase5/README.md](docs/phase5/README.md) for Phase 5 documentation index.

---
description: "Database schema design, Mongoose models, indexing, query patterns. Apply when designing data models, creating Mongoose schemas, optimizing queries, or working with MongoDB in CampusOS."
trigger: model_decision
---

# Database Designer Rules

## Database Technology

- **MongoDB** with **Mongoose** ODM for all modules
- Default connection: `mongodb://localhost:27017/campusos`
- Connection pool: `maxPoolSize: 10`, `minPoolSize: 2`
- No in-memory storage — all modules persist to MongoDB

## Schema Location

Mongoose models live in two places depending on the module:

- **Operations modules** (vendor, resource, scheduling, budget): `backend/src/database/schemas/`
- **Other modules**: `apps/<module>/src/schema/`

## Schema Design Patterns

```javascript
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['catering', 'technology', 'venue', 'equipment', 'other'] },
  email: { type: String, required: true, lowercase: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'suspended'] }
}, { timestamps: true });

export const Vendor = mongoose.model('Vendor', vendorSchema);
```

**Rules:**
- Always use `timestamps: true` for `createdAt`/`updatedAt`
- Use enums for constrained values
- Use `trim: true` on string fields
- Use `lowercase: true` on email fields
- Define `required` explicitly for mandatory fields

## Indexing Strategy

- Index frequently filtered fields: `status`, `category`, `role`
- Index sort fields: `createdAt`, `updatedAt`
- Index unique fields: `email` (with `unique: true`)
- Compound indexes for common query patterns
- Avoid indexing low-cardinality boolean fields

## Relationship Patterns

- **One-to-Many**: Store reference ID on the "many" side
  - Example: `events` → `registrations` via `eventId` field
- **Embedded documents**: Use for data that is always fetched together
- **Reference IDs**: Use for cross-module relationships (maintain independence)

## Service Return Pattern

Services that interact with the database return result objects:

```javascript
return { success: true, vendor: vendor.toObject() };
return { success: false, error: 'Missing required fields' };
```

- Don't throw for business errors — return error objects
- Only throw for unexpected/system errors

## Testing with Database

- Tests use **Vitest** with **mongodb-memory-server**
- `beforeAll`: Create `MongoMemoryServer`, connect via `connectDB(uri)`
- `beforeEach`: Clear collections for isolation (`Model.deleteMany({})`)
- `afterAll`: Disconnect and stop memory server
- Timeout: `120000` ms for first-run binary download

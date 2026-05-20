---
name: database-design
description: "MongoDB/Mongoose schema design, indexing, relationships, query patterns for CampusOS. Use when designing data models, creating Mongoose schemas, optimizing queries, or setting up database connections."
---

# Database Design

## When to Use

- Designing data models for new features
- Creating Mongoose schemas
- Optimizing query performance
- Planning indexing strategies
- Setting up database connections

## Procedure

### Phase 1: Schema Design

CampusOS uses **MongoDB with Mongoose** for all data persistence.

```javascript
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['catering', 'technology', 'venue', 'equipment', 'other'] },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  status: { type: String, default: 'active', enum: ['active', 'inactive', 'suspended'] },
  rating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

export const Vendor = mongoose.model('Vendor', vendorSchema);
```

Rules:
- Always use `timestamps: true` for `createdAt`/`updatedAt`
- Use enums for constrained values
- Mark `required: true` explicitly
- Use `trim: true` on strings, `lowercase: true` on emails

### Phase 2: Schema Locations

- **Operations modules** (vendor, resource, scheduling, budget): `backend/src/database/schemas/`
- **Other modules**: `apps/<module>/src/schema/`

### Phase 3: Indexing Strategy

- Index primary lookup fields (email, status, category)
- Index sort fields (createdAt, updatedAt)
- Use `unique: true` for emails where appropriate
- Avoid indexing low-cardinality booleans
- Monitor slow queries with `mongoose.set('debug', true)`

### Phase 4: Relationship Patterns

- **One-to-Many**: Reference ID on the "many" side (`eventId` in registrations)
- **Embedded**: For data always fetched together
- **Cross-module**: Reference IDs only — never import from other modules

### Phase 5: Connection Configuration

```javascript
// database/connection.js
const options = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2
};
```

Default URI: `mongodb://localhost:27017/campusos`

## Quick Reference

```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Connect to shell
mongosh mongodb://localhost:27017/campusos

# Check connection from backend
curl http://localhost:4000/health
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure MongoDB is running (`docker start mongodb`) |
| Validation error | Check required fields and enum values in schema |
| Slow queries | Add indexes on filter/sort fields |
| Duplicate key | Check `unique: true` indexes, handle in service |

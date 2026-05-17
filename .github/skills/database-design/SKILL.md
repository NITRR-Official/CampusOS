---
name: database-design
description: 'Database schema design, migrations, relationships, indexing strategies. Use when: designing data models, creating migrations, optimizing queries, setting up database connections, handling relationships.'
argument-hint: 'entity-name, relationships, indexes'
---

# Database Design

## When to Use

- Designing data models for new features
- Creating database migrations
- Optimizing query performance
- Setting up database connections
- Defining entity relationships
- Planning indexing strategies

## What This Skill Does

Establishes CampusOS database schema design patterns, migration workflows, relationship modeling, and performance optimization through proper indexing.

## Procedure

### Phase 1: Schema Design

1. Identify entities (Users, Courses, Activities, Submissions, etc.)
2. Define entity attributes with appropriate types:
   - Primary keys (UUIDs or integers)
   - Timestamps (created_at, updated_at)
   - Foreign keys for relationships
   - Status/enum fields
3. Document relationships (1-to-many, many-to-many)
4. Plan soft deletes vs hard deletes

### Phase 2: Relationship Design

1. One-to-Many: Foreign key on "many" side
   - Example: `courses.id` → `activities.course_id`
2. Many-to-Many: Junction table
   - Example: `users_courses` table with `user_id`, `course_id`
3. Polymorphic relationships: Type + ID columns
   - Example: `comments.commentable_type`, `comments.commentable_id`

### Phase 3: Indexing Strategy

1. Index primary keys (automatic)
2. Index foreign keys for JOIN performance
3. Index frequently filtered columns (status, role, dates)
4. Index sort columns (created_at, updated_at)
5. Avoid indexing low-cardinality columns
6. Monitor slow queries

### Phase 4: Migration Creation

1. Create migration file: `migrations/TIMESTAMP_create_table_name.js`
2. Include UP migration (create) and DOWN migration (rollback)
3. Define constraints:
   - NOT NULL on required fields
   - UNIQUE for usernames, emails
   - FOREIGN KEY references
4. Test migration up and down

### Phase 5: Connection & ORM Setup

1. Configure database connection string (host, user, password, database)
2. Set up connection pool (min: 2, max: 10 connections)
3. Initialize ORM (Mongoose for MongoDB, or Prisma)
4. Enable connection pooling for production

## Quick Reference

```bash
# Create migration
npx prisma migrate dev --name create_activities

# Apply migrations
pnpm db:migrate

# Rollback last migration
pnpm db:rollback

# View data (MongoDB)
mongosh

# Seed database
pnpm db:seed
```

## Common Issues

| Issue                        | Solution                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| Migration fails              | Check syntax, verify field names, ensure no circular dependencies |
| Foreign key constraint error | Ensure referenced record exists, check constraint definition      |
| Slow queries                 | Run explain plan, verify indexes exist on filter/join columns     |
| Connection pool exhausted    | Increase pool size or check for connection leaks                  |
| Type mismatch                | Ensure ORM schema matches database field types                    |
| Duplicate key errors         | Check unique indexes, migrate existing duplicate data first       |
| Migration not applied        | Verify migration file timestamp, check migration status           |

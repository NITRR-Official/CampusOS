---
name: documentation-generation
description: 'API documentation, Swagger/OpenAPI, tutorials, code examples. Use when: documenting APIs, auto-generating docs, creating developer guides, publishing API specs.'
argument-hint: 'doc-type, output-format'
---

# Documentation Generation

## When to Use

- Auto-generating API documentation from code
- Creating developer onboarding guides
- Publishing API specifications (Swagger/OpenAPI)
- Generating SDK documentation
- Creating interactive API playgrounds
- Publishing tutorials and architecture guides

## What This Skill Does

Automates API documentation generation and maintains developer-friendly guides for CampusOS.

## Procedure

### Phase 1: OpenAPI/Swagger Setup

1. Install Swagger packages: `pnpm add express-jsdoc-swagger swagger-ui-express`
2. Create `src/swagger.ts`:
   ```typescript
   import swaggerJsdoc from 'swagger-jsdoc';
   const specs = swaggerJsdoc({
     definition: {
       openapi: '3.0.0',
       info: { title: 'CampusOS API', version: '1.0.0' },
       servers: [{ url: 'http://localhost:3000' }]
     },
     apis: ['src/routes/**/*.ts']
   });
   app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
   ```
3. Annotate routes with JSDoc comments:
   ```typescript
   /**
    * @swagger
    * /activities:
    *   get:
    *     description: List all activities
    *     responses:
    *       200:
    *         description: Success
    *         content:
    *           application/json:
    *             schema: {$ref: '#/components/schemas/Activity'}
    */
   ```
4. Define schemas in OpenAPI format
5. Enable CORS for Swagger UI
6. Export OpenAPI JSON: `GET /api-docs.json`

### Phase 2: Schema Documentation

1. Define all request/response models:
   ```yaml
   schemas:
     Activity:
       type: object
       properties:
         id: { type: string, format: uuid }
         name: { type: string, minLength: 1 }
         status: { type: string, enum: [draft, published] }
       required: [id, name]
   ```
2. Document parameters:
   - Path: `/activities/:id`
   - Query: `?page=1&limit=10`
   - Header: `Authorization: Bearer <token>`
   - Body: Request payload schema
3. Document all response codes:
   - 200 OK, 201 Created
   - 400 Bad Request (validation error)
   - 401 Unauthorized (missing token)
   - 404 Not Found, 500 Server Error
4. Include examples in each endpoint:
   ```json
   {
     "id": "550e8400-e29b-41d4-a716-446655440000",
     "name": "Midterm Exam",
     "status": "published"
   }
   ```
5. Document error response format
6. Link to guides for complex workflows

### Phase 3: Markdown Guides

1. Create `docs/` directory structure:
   ```
   docs/
   ├── getting-started.md
   ├── api-guide.md
   ├── architecture.md
   ├── examples/
   │  └── create-activity.md
   └── troubleshooting.md
   ```
2. Write getting-started guide:
   - Installation steps
   - Local setup (pnpm install)
   - Sample requests
   - Common errors
3. Create API guide:
   - Overview of resource types
   - Authentication flow
   - Rate limiting details
   - Pagination examples
4. Add architecture document:
   - System diagram
   - Service relationships
   - Data flow
   - Technology stack
5. Include code examples in multiple languages:
   - cURL, JavaScript, Python
6. Keep "updated" date current

### Phase 4: Code Examples & SDKs

1. Create `examples/` directory with runnable scripts:
   ```typescript
   // examples/create-activity.ts
   import { CampusOS } from '@campusos/sdk';
   const client = new CampusOS({ token: process.env.API_TOKEN });
   const activity = await client.activities.create({ name: 'Exam' });
   ```
2. Generate SDK documentation from OpenAPI:
   ```bash
   npx openapi-generator-cli generate \
     -i http://localhost:3000/api-docs.json \
     -g typescript-fetch \
     -o sdk/
   ```
3. Document SDK installation & usage
4. Include error handling examples
5. Add authentication examples
6. Provide filtering/sorting examples

### Phase 5: API Changelog & Versioning

1. Document API changes in `CHANGELOG.md`:

   ```markdown
   ## [v1.1.0] - 2024-03-15

   ### Added

   - New endpoint: POST /activities/:id/duplicate
   - Filter parameter: ?category=exam

   ### Deprecated

   - Endpoint: GET /submissions (use /activities/:id/submissions)
   ```

2. Maintain separate API version branches (v1, v2)
3. Document migration guides when updating endpoints
4. Include deprecation notices (3-month warning)
5. Support multiple API versions in production
6. Update docs for each release

### Phase 6: Publishing & Hosting

1. Generate static documentation: `pnpm run docs:build`
2. Host on GitHub Pages or Vercel
3. Enable search (Algolia DocSearch)
4. Set up automatic updates on commit
5. Include version selector (v1.0, v1.1, v2.0)
6. Monitor documentation feedback (GitHub issues)

## Quick Reference

```bash
# Generate Swagger spec
pnpm exec swagger-jsdoc src/routes/**/*.ts > api-spec.json

# Validate OpenAPI spec
pnpm add --save-dev swagger-cli
pnpm exec swagger-cli validate api-spec.json

# Generate SDK from OpenAPI
npx openapi-generator-cli generate -i api-spec.json -g typescript-fetch -o sdk/

# Start docs server locally
pnpm run docs:serve

# Build static docs
pnpm run docs:build

# Preview docs
open http://localhost:3000/api-docs
```

## Troubleshooting

| Issue                               | Solution                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| Swagger UI not loading              | Verify `swagger-ui.serve` middleware registered; check `/api-docs.json` accessible |
| OpenAPI schema validation fails     | Use `swagger-cli validate`; check YAML syntax, required fields                     |
| Missing endpoints in generated docs | Verify JSDoc comments above route handlers; check OpenAPI version match            |
| Generated SDK doesn't match API     | Regenerate from latest spec: `openapi-generator-cli generate ...`                  |
| Examples are outdated               | Add CI/CD check to validate code examples run successfully                         |
| Search not working in docs          | Enable Algolia DocSearch; verify `docsearch` config in sidebar                     |

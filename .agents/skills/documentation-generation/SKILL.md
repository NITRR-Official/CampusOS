---
name: documentation-generation
description: "API documentation, OpenAPI specs, developer guides for CampusOS. Use when documenting APIs, creating developer guides, generating API specs, or maintaining documentation."
---

# Documentation Generation

## When to Use

- Auto-generating API documentation from code
- Creating developer onboarding guides
- Publishing API specifications
- Maintaining developer-friendly documentation

## Procedure

### Phase 1: API Documentation

Document CampusOS endpoints following `docs/guides/API_STANDARDS.md`:

- All endpoints prefixed with `/api/v1/`
- Document both response patterns (Pattern A: wrapped, Pattern B: unwrapped)
- Include authentication requirements (Bearer token)
- List public vs protected routes
- Show real request/response examples with port **4000**

### Phase 2: Code Examples

All code examples must use:
```javascript
// ✅ ES Modules
import express from 'express';
export async function init(app, registry) { ... }

// ✅ async/await
const result = await service.create(data);
```

Never use `require()`, `.then()`, or CommonJS patterns in documentation.

### Phase 3: Documentation Structure

Maintain docs in `/docs/` following existing structure:
```
docs/
├── architecture/       # Backend, plugin system, overview
├── contributing/       # Coding guidelines, contributing guide
├── frontend/           # Overview, design system, dark mode
├── getting-started/    # Setup, database, environment
├── guides/             # API standards, security, testing, git workflow
└── phases/             # Phase-specific implementation
```

### Phase 4: Architecture Diagrams

Use Mermaid for diagrams. Document actual flows:
- Startup: `index.js → connectDB → createApp → startServer`
- Request: `Body parsing → CORS → Logger → Auth → Routes → Error handler`
- Plugin: `scan /apps/ → import entry → call init(app, registry)`

## Quick Reference

```bash
# Backend API docs (live)
curl http://localhost:4000/health

# Verify doc commands work
pnpm dev    # Start everything
pnpm build  # Build all
```

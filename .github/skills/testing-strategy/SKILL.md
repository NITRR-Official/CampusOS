---
name: testing-strategy
description: 'Unit tests, integration tests, test structure, mocking, fixtures. Use when: writing tests for backend services, testing API endpoints, mocking database calls, structuring test suites.'
argument-hint: 'test-type, module-name, test-cases'
---

# Testing Strategy

## When to Use

- Writing unit tests for services
- Testing API endpoints
- Mocking database and external calls
- Setting up test fixtures
- Structuring test suites for modules
- Ensuring feature coverage

## What This Skill Does

Establishes CampusOS testing patterns for unit tests, integration tests, mocking strategies, fixture management, and test organization across backend services.

## Procedure

### Phase 1: Test Structure Organization

1. Create test directory structure:
   ```
   test/
   ├── unit/
   │   ├── services/
   │   └── utils/
   ├── integration/
   │   ├── api/
   │   └── database/
   ├── fixtures/
   │   ├── users.json
   │   └── activities.json
   └── setup.js
   ```
2. Use `.test.js` or `.spec.js` file naming
3. Group related tests with `describe()` blocks
4. Write focused tests with single assertion per test

### Phase 2: Unit Testing

1. Test individual functions/methods in isolation
2. Mock external dependencies (database, APIs, services)
3. Test both success and error paths
4. Use descriptive test names: `should return user when email exists`
5. Structure with Arrange-Act-Assert:

   ```javascript
   describe('UserService.findByEmail', () => {
     it('should return user when email exists', () => {
       // Arrange
       const email = 'test@example.com';
       const mockUser = { id: 1, email };

       // Act
       const result = userService.findByEmail(email);

       // Assert
       expect(result).toEqual(mockUser);
     });
   });
   ```

### Phase 3: Mocking & Fixtures

1. Create `fixtures/` directory with sample data JSON files
2. Load fixtures in test setup:
   ```javascript
   const users = require('../fixtures/users.json');
   ```
3. Mock external calls with jest or sinon:
   ```javascript
   jest.spyOn(database, 'query').mockResolvedValue([users[0]]);
   ```
4. Restore mocks after each test
5. Mock file system, API calls, email services

### Phase 4: Integration Testing

1. Test multiple components together (API endpoint → service → database)
2. Use test MongoDB instance or in-memory database
3. Start server for HTTP tests
4. Test full request/response flow
5. Setup database state before each test
6. Clean up after each test

### Phase 5: Test Coverage

1. Aim for >80% line coverage
2. Focus on business logic paths
3. Cover error scenarios
4. Use coverage tool: `pnpm test:coverage`
5. Report coverage in CI/CD pipeline

### Phase 6: Test Maintenance

1. Keep tests focused and independent
2. Avoid test interdependencies
3. Use beforeEach/afterEach for setup/teardown
4. Update tests when refactoring features
5. Remove obsolete tests
6. Mock time-dependent code: `jest.useFakeTimers()`

## Quick Reference

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test test/unit/services/user.test.js

# Run with coverage report
pnpm test:coverage

# Run integration tests only
pnpm test:integration
```

## Common Issues

| Issue                     | Solution                                                          |
| ------------------------- | ----------------------------------------------------------------- |
| Tests fail intermittently | Check for async issues, add proper await/done() callbacks         |
| Mock not working          | Verify mock is applied before implementation, check require order |
| Test isolation broken     | Ensure mocks restored after each test, use beforeEach/afterEach   |
| Timeout errors            | Increase timeout, check for hanging promises, add done() callback |
| Fixture data stale        | Update fixture files when schema changes, version fixtures        |
| Database locked           | Use in-memory DB for tests, run tests serially if needed          |
| Coverage not improving    | Focus on untested branches, add edge case tests                   |

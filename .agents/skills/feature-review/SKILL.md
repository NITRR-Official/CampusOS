---
name: production-feature-audit
description: Perform a complete production-quality audit of a newly implemented feature, reviewing architecture, code quality, security, scalability, UI/UX, testing, and documentation before considering the feature complete.
---

# Production Feature Audit

You are the **final production quality gate** for every feature implementation.

Your responsibility is **not to implement new features**, but to verify, improve, and finalize the implementation created by another agent until it satisfies production-quality standards.

## Workflow

### 1. Understand the Project

Before reviewing any code:

- Read all relevant project documentation.
- Read architecture documentation.
- Read ADRs.
- Read project rules and conventions.
- Read existing skills if relevant.
- Build sufficient understanding of the project's architecture and coding standards before making changes.

Never review code without first understanding the project.

---

### 2. Identify the Feature

Determine the current feature by inspecting the repository.

Use Git (for example, `git status` and the relevant diffs) to identify the uncommitted changes.

Focus your review on the modified files while considering their impact on the rest of the codebase.

---

### 3. Audit the Implementation

Review the implementation thoroughly.

## Architecture

Ensure:

- Existing architecture is respected.
- Proper separation of concerns.
- Correct layering.
- Proper dependency direction.
- Modular design.
- Consistent abstractions.

---

## Code Quality

Ensure:

- Clean and readable code.
- DRY.
- KISS.
- YAGNI.
- Meaningful naming.
- No dead code.
- No unnecessary duplication.
- Proper error handling.
- Consistent coding style.

---

## SOLID & Design Patterns

Verify:

- SOLID principles.
- Appropriate design patterns.
- High cohesion.
- Low coupling.
- Extensible implementation.

---

## Security

Verify:

- Secure coding practices.
- Input validation.
- Authentication.
- Authorization.
- Proper secret management.
- No sensitive information leakage.
- Protection against common vulnerabilities.
- Safe error handling.

---

## Scalability & Performance

Ensure:

- Efficient algorithms.
- Efficient data access.
- Minimal unnecessary computation.
- No avoidable re-renders.
- Future scalability is considered.

---

## Reliability

Verify:

- Edge cases.
- Failure scenarios.
- Null handling.
- Proper logging where appropriate.
- Robust error recovery.

---

## UI / UX

Ensure:

- Consistent premium design language.
- Existing reusable components are used.
- Responsive layouts.
- Accessible interfaces.
- Consistent loading states.
- Empty states.
- Error states.
- Visual consistency across the application.

Avoid introducing duplicate UI implementations when reusable components already exist.

---

## Testing

Verify:

- Existing functionality is preserved.
- Code remains testable.
- Missing tests are identified where appropriate.

---

## Documentation

Update documentation whenever necessary.

Including:

- README
- ADRs
- Architecture documentation
- API documentation
- Developer documentation

Documentation should always reflect the implementation.

---

### 4. Improve the Implementation

Fix every issue discovered during the audit.

Refactor where necessary while preserving intended functionality.

Prefer improving existing implementations over introducing unnecessary complexity.

---

### 5. Final Verification

After making changes:

- Review the implementation again.
- Verify that every identified issue has been resolved.
- Ensure no regressions were introduced.

Repeat this process until the feature satisfies production-quality standards.

---

# Guiding Principles

Always:

- Think before making changes.
- Prefer consistency over unnecessary innovation.
- Reuse existing implementations whenever possible.
- Keep changes minimal but complete.
- Optimize for readability, maintainability, scalability, security, and developer experience.
- Leave the codebase cleaner than you found it.

The feature should only be considered complete when it meets production-quality standards across architecture, security, maintainability, scalability, UI/UX, testing, and documentation.
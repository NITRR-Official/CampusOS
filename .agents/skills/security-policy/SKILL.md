---
name: security-policy
description: "Vulnerability disclosure, responsible reporting, compliance, security contacts for CampusOS. Use when setting up security reporting, creating vulnerability disclosure policy, or managing incident response."
---

# Security Policy

## When to Use

- Setting up responsible vulnerability disclosure
- Creating SECURITY.md policy
- Establishing security contacts
- Documenting incident response procedures

## Procedure

### Phase 1: Security Policy (SECURITY.md)

```markdown
# Security Policy

## Reporting a Vulnerability

**Do not open public issues for security vulnerabilities.**

Email: security@campusos.org

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Response Timeline

- Acknowledgement: Within 24 hours
- Initial assessment: Within 7 days
- Fix or mitigation: Within 30 days
- Public disclosure: After fix published
```

### Phase 2: Vulnerability Coordination

1. Receive report → acknowledge within 24h
2. Investigate and confirm (3 days)
3. Develop patch privately
4. Deploy fix to production
5. Publish advisory
6. Credit researcher (with permission)

### Phase 3: Incident Response

| Severity | Definition | Fix Timeline |
|----------|-----------|-------------|
| Critical | Data breach, auth bypass | 72 hours |
| High | DoS, privilege escalation | 7 days |
| Medium | Info disclosure, authz bypass | 14 days |
| Low | Low-impact issues | 30 days |

### Phase 4: Compliance

| Framework | Relevance |
|-----------|-----------|
| GDPR | If serving EU users |
| FERPA | Education records |
| SOC 2 | Enterprise customers |
| CCPA | California users |

### Phase 5: Automated Scanning

```bash
pnpm audit               # Dependency vulnerabilities (weekly)
pnpm exec snyk code test  # Static analysis
```

## Quick Reference

```bash
pnpm audit                        # Security audit
git log -p | grep -i "secret"     # Check for exposed secrets
```

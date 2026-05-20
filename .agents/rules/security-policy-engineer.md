---
description: "Vulnerability disclosure, compliance, incident response procedures, security governance. Apply when creating security policies, planning incident response, assessing compliance requirements, or establishing vulnerability reporting processes for CampusOS."
trigger: model_decision
---

# Security Policy Engineer Rules

## Vulnerability Disclosure Process

### Reception
1. Researcher reports vulnerability via security contact
2. Acknowledgment within 24 hours
3. Assign severity level (Critical, High, Medium, Low)

### Investigation
1. Investigate and confirm vulnerability
2. Develop fix on private branch
3. Write security advisory

### Remediation
1. Release fix
2. Public disclosure after fix deployed
3. Post-mortem and lessons learned

## Incident Severity Levels

| Level | Definition | Response Time | Action |
|-------|-----------|---------------|--------|
| P1 - Critical | System down, data breach | Immediate | All hands |
| P2 - High | Major functionality broken | 1 hour | Incident commander assigned |
| P3 - Medium | Partial degradation | 4 hours | Triage and plan |
| P4 - Low | Minor issue | 1 day | Backlog planning |

## Response SLAs

| Severity | Fix Timeline |
|----------|-------------|
| Critical | 72 hours |
| High | 7 days |
| Medium | 14 days |
| Low | 30 days |

## Compliance Frameworks

| Framework | Relevance |
|-----------|-----------|
| GDPR | If serving EU users |
| FERPA | Education records |
| SOC 2 | Enterprise customers |
| CCPA | If serving California users |

## Security Monitoring Practices

- Dependency vulnerabilities: `pnpm audit` weekly
- Secrets detection: Pre-commit hooks
- OWASP Top 10 review annually
- Failed authentication attempt logging
- Security logging of suspicious API activity

## Constraints

- Never disclose vulnerabilities publicly before fix is deployed
- Never make policy decisions without team review
- Always document incident post-mortems within 7 days
- Security policies require team consensus before enforcement

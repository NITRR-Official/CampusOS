---
name: security-policy
description: 'Vulnerability disclosure, responsible reporting, compliance documentation, security contacts. Use when: setting up security reporting, creating vulnerability disclosure policy, managing security contacts.'
argument-hint: 'policy-type, severity-level'
---

# Security Policy

## When to Use

- Setting up responsible vulnerability disclosure process
- Creating SECURITY.md policy
- Establishing security contact information
- Documenting incident response procedures
- Managing security certifications and compliance
- Coordinating with security researchers

## What This Skill Does

Establishes CampusOS security policy including responsible disclosure, vulnerability coordination, and incident response.

## Procedure

### Phase 1: Security Policy Documentation

1. Create `SECURITY.md` in repository root:

   ```markdown
   # Security Policy

   ## Reporting a Vulnerability

   **Do not open public issues for security vulnerabilities.**

   Email security team: [security@campusos.org](mailto:security@campusos.org)

   Include in your report:

   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

   **Response Timeline:**

   - Acknowledgement: Within 24 hours
   - Initial assessment: Within 7 days
   - Fix or mitigation: Within 30 days
   - Public disclosure: After fix published

   ## Supported Versions

   | Version | Supported           |
   | ------- | ------------------- |
   | 2.x     | ✅ Actively         |
   | 1.x     | ⚠️ Until 2024-12-31 |
   | 0.x     | ❌ No support       |

   ## PGP Public Key

   [Download key](./security-pgp.asc)
   ```

2. Define response timeframes:
   - Critical: Fix within 72 hours
   - High: Fix within 7 days
   - Medium: Fix within 14 days
   - Low: Fix within 30 days
3. Document responsible disclosure agreement
4. List security contacts (with PGP key)
5. Include bug bounty info (if applicable)
6. Commit to version support timeline

### Phase 2: Vulnerability Coordination

1. Set up security email: security@campusos.org
   - Monitored by 2+ team members
   - 24/7 response commitment
   - Secure (end-to-end encrypted preferred)
2. Create private security advisory:
   - GitHub Security Advisory (`/security/advisories`)
   - Only visible to maintainers
   - Template for coordinated disclosure
3. Document coordination process:
   - Researcher reports → team investigates (3 days)
   - Draft patch → researcher reviews (5 days)
   - Fix deployed to production
   - Public disclosure with advisories published
4. Keep researcher informed at each step
5. Credit researcher in advisory (with permission)
6. Publish CVE after fix released

### Phase 3: Incident Response Plan

1. Define incident severity levels:
   - **Critical**: Data breach, RCE, authentication bypass
   - **High**: Denial of service, privilege escalation
   - **Medium**: Information disclosure, authorization bypass
   - **Low**: Low-impact data issues, non-urgent fixes
2. Response team:
   - On-call security engineer
   - Incident commander
   - Communications lead
   - Database administrator (if data affected)
3. First response steps:
   - Acknowledge receipt (within 1 hour)
   - Start incident investigation
   - Determine scope and impact
   - Notify stakeholders (if data breach)
4. Develop fix (under embargo):
   - Create private branch
   - Implement patch
   - Test thoroughly
   - Prepare release
5. Deploy and monitor:
   - Release patch version immediately
   - Publish advisory
   - Monitor for exploitation
   - Post-incident review (7 days later)

### Phase 4: Compliance & Standards

1. Document compliance requirements:
   - GDPR (if EU users)
   - HIPAA (if health data)
   - FERPA (if education records)
   - SOC 2 (if enterprise customers)
2. Annual security audit:
   - Penetration testing
   - Code review audit
   - Dependency scanning
   - Infrastructure assessment
3. Maintain certificates:
   - SOC 2 Type II (annual)
   - ISO 27001 (if applicable)
   - PCI DSS (if payment processing)
4. Document data retention policy
5. Implement data deletion workflows
6. Security training for team (annual)

### Phase 5: Monitoring & Prevention

1. Automated scanning:
   - Dependency vulnerabilities: `pnpm audit` weekly
   - Container scanning: Build-time image scan
   - SAST (static analysis): `snyk code test` on all commits
   - Secrets detection: Pre-commit hook
2. Monitor threat intelligence:
   - Follow security advisories (npm, CVE feeds)
   - Review GitHub alerts
   - Check OWASP top 10 annually
3. Implement security headers:
   - `Content-Security-Policy`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Strict-Transport-Security`
4. Security logging:
   - Failed authentication attempts
   - Suspicious API activity
   - Data access patterns
5. Regular patches: Monthly OS/dependency updates
6. Red team exercises: Quarterly simulated attacks

### Phase 6: Public Disclosure & Advisories

1. Create GitHub Security Advisory:
   - Description: Technical details
   - Severity: CVSS score
   - GHSA ID: GitHub advisory ID (auto-generated)
   - CVE: CVE ID (if requested)
2. Format advisory clearly:

   ```
   ## Vulnerability Description
   [Include: what it is, who's affected]

   ## Steps to Mitigate
   - Upgrade to v2.1.1 or later
   - Or implement workaround: [steps]

   ## Timeline
   - Reported: [date]
   - Fixed: [date]
   - Published: [date]

   ## Credits
   [Researcher name/org with permission]
   ```

3. Publish advisory:
   - Link in `SECURITY.md`
   - Twitter announcement
   - Mailing list notification
   - Release notes
4. Monitor for exploitation attempts
5. Document lessons learned
6. Schedule follow-up security review

## Quick Reference

```bash
# Check for known vulnerabilities
pnpm audit

# Scan code for vulnerabilities
pnpm exec snyk code test

# Scan container images
trivy image campusos-backend:latest

# Generate security report
pnpm exec snyk test --json > security-report.json

# Test TLS/HTTPS headers
curl -I https://campusos.org | grep -i secure

# Check for exposed secrets
git log -p | grep -i "password\|token\|secret"
```

## Troubleshooting

| Issue                                | Solution                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Researcher report ignored            | Ensure security@domain monitored; check spam folder; auto-responder set up                                      |
| CVE requested but no CVE coordinator | Contact MITRE; CNA (CVE Numbering Authority) assigns; coordinate with GitHub                                    |
| Patch doesn't fix vulnerability      | Hold embargo; extend fix window; consider temporary workaround; get researcher approval for extended disclosure |
| Media attention after disclosure     | Prepare talking points; confirm facts; engage communications team; correct misinformation quickly               |
| No researchers reporting issues      | Promote security.md; offer bug bounty; participate in security communities; hire red team for testing           |
| Compliance violation detected        | Report to compliance officer; notify affected users; file incident report; plan remediation                     |

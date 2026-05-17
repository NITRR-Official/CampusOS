# Discussions

This directory contains decision records, meeting notes, and architectural decision records (ADRs).

## Purpose

Document key decisions, discussions, and their rationale. This creates a historical record of WHY choices were made.

## Document Types

### Architecture Decision Records (ADRs)

Format: `NNN-title-with-dashes.md` (e.g., `001-tech-stack-selection.md`)

Use ADRs for:

- Technology choices
- Architectural patterns
- Major design decisions

See [001-tech-stack-selection.md](001-tech-stack-selection.md) for a template.

### Meeting Notes

Format: `meeting-YYYY-MM-DD.md`

Document:

- Attendees
- Agenda
- Discussion points
- Action items

### Discussion Threads

Format: `discussion-topic-name.md`

For async discussions that don't fit in meetings or ADRs.

## ADR Status Values

- **Proposed** - Under consideration
- **Accepted** - Decision made and active
- **Deprecated** - No longer in use
- **Superseded** - Replaced by another ADR

## Numbering

Number ADRs sequentially starting from 001. Never reuse numbers.

## Best Practices

- **Write as decisions are made** - Don't retroactively document
- **Be concise** - Focus on the decision and rationale
- **Include context** - What situation led to this decision?
- **List alternatives** - What else was considered?
- **Note consequences** - What are the trade-offs?

## Template

Use the template in [templates/decision-record.md](../templates/decision-record.md)

# Recruitment Plugin

The Recruitment plugin handles campaigns for onboarding new members into a club or organization. It manages applicant pipelines, interview scheduling, and application reviewing.

## Architecture Layer

**3. Execution Layer**

## Collections

- `Campaign`: Defines a recruitment cycle (e.g., "Fall 2026 Core Team Hunt").
- `Application`: A user's submission to a specific campaign.
- `Interview`: Time slots and feedback for applicants.

## Events

- **Emits**: `recruitment:application_submitted`, `recruitment:application_status_changed`.
- **Listens for**: `club:deleted` (to cascade delete all active campaigns and applications for that club).

## Permissions

- `recruitment:manage`: Allows creating campaigns, reviewing applications, and advancing candidates through the pipeline.
- `recruitment:view`: Allows volunteers and coordinators to view applications and conduct interviews, but not make final hiring decisions.

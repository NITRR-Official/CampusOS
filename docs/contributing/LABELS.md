# 🏷️ GitHub Issue Labels Guide

To make contributing to **CampusOS** as smooth as possible, we use a structured labeling system. This helps contributors find tasks matching their skills, track the status of work, and understand priority levels.

This guide lists the exact labels used in the active GitHub repository and filters to help you pick the right issue.

---

## 🚦 Difficulty Levels

Use these labels to match issues with your experience level. Note that some filters/views map these to legacy system codes (e.g., `d0-easy`).

| Label                 | Color            | Filter Code        | Description                                                                          | Recommended For                                               |
| :-------------------- | :--------------- | :----------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| `good first issue`    | **Purple**       | `good-first-issue` | Self-contained, well-scoped tasks requiring minor changes (< 2 hours).               | First-time contributors.                                      |
| `difficulty:easy`     | **Grayish-Blue** | `d0-easy`          | Straightforward changes, standard patterns, minor debugging.                         | New contributors who have successfully set up local servers.  |
| `difficulty:medium`   | **Yellow-Green** | `d1-medium`        | Requires a good understanding of a specific module or component.                     | Regular contributors familiar with the modular plugin system. |
| `difficulty:hard`     | **Dark Red**     | `d2-hard`          | Complex architectural changes, major features, or core system refactoring.           | Experienced contributors and collaborators.                   |
| `difficulty:critical` | **Deep Purple**  | `d3-very-hard`     | High complexity, expert-level system design or critical security/performance issues. | Core maintainers and domain experts.                          |

---

## 🎯 Priority Levels

These labels define the urgency and impact of an issue.

| Label         | Color          | Description                                                     | Urgency / Priority                        |
| :------------ | :------------- | :-------------------------------------------------------------- | :---------------------------------------- |
| `p0-critical` | **Bright Red** | Blocks release or breaks core production functionality.         | High — Addressed immediately.             |
| `p1-high`     | **Orange**     | Sprint focus or major functionality issues.                     | Medium-High — Focus of the current phase. |
| `p2-medium`   | **Blue-Gray**  | Normal feature requests, optimization, or minor UI adjustments. | Medium — Backlog / Next sprint.           |
| `p3-low`      | **Light Gray** | Nice-to-haves, minor refactoring, cosmetic polish.              | Low — Community backlog.                  |

---

## 📂 Category / Focus Areas

These labels specify which part of the codebase is affected.

| Label                                           | Color             | Filter Category  | Description                                                                                |
| :---------------------------------------------- | :---------------- | :--------------- | :----------------------------------------------------------------------------------------- |
| `backend`                                       | **Orange**        | `backend`        | Server core, Express.js plugins, service registry, routes, or backend logic.               |
| `frontend`                                      | **Gray**          | `frontend`       | Next.js layout, React components, Tailwind CSS styling, or API clients.                    |
| `database`                                      | **Purple**        | `database`       | MongoDB collections, Mongoose schemas, queries, or database indexing.                      |
| `design`                                        | **Greenish-Gray** | `ui-ux`          | UI/UX mockups, wireframes, Figma integrations, or layout assets.                           |
| `ui`                                            | **Light Blue**    | `ui-ux`          | Interface presentation, styling issues, and theme palette changes.                         |
| `ux`                                            | **Lavender**      | `ui-ux`          | User experience improvements, screen flows, accessibility, or responsiveness.              |
| `figma`                                         | **Teal**          | `ui-ux`          | Design assets directly exported or synced from Figma design files.                         |
| `api`                                           | **Blue**          | `api`            | REST API standards, route middleware, request validation, or endpoint specifications.      |
| `calendar`                                      | **Magenta**       | `calendar`       | Scheduling components, timeline booking system, or calendar event flows.                   |
| `workflow`                                      | **Teal**          | `workflow`       | Task workflows, event lifecycle rules, or custom logic pipelines.                          |
| `web`                                           | **Cyan**          | `web`            | General web standard alignments or overall browser compatibility adjustments.              |
| `devops` / `deployment` / `ci-cd` / `ci` / `cd` | **Purple-Gray**   | `infrastructure` | CI/CD pipelines, GitHub Actions workflows, Docker container configs, or server deployment. |
| `docs` / `type:docs`                            | **Light Gray**    | `documentation`  | Revisions to markdown guides, API references, or JSDoc comments.                           |

---

## 🛠️ Issue Type / Kind

Identifies what kind of issue you are looking at.

| Label                        | Color            | Filter Category      | Description                                                                    |
| :--------------------------- | :--------------- | :------------------- | :----------------------------------------------------------------------------- |
| `type:feature`               | **Reddish-Pink** | `feature`            | New feature or functionality request.                                          |
| `enhancement`                | **Teal**         | `enhancement`        | Improving or expanding an existing feature.                                    |
| `bug`                        | **Crimson**      | `bug`                | Reproducible error, unexpected behavior, or crash.                             |
| `question`                   | **Yellow**       | `question`           | Clarification requests, setup issues, or general discussions.                  |
| `security` / `type:security` | **Dark Red**     | `security`           | Authentication hardening, OWASP vulnerabilities, or sensitive data policies.   |
| `contribution-drive`         | **Gold**         | `contribution-drive` | Focus issues created for group contribution events or hackathons.              |
| `exceptional`                | **Orange**       | `exceptional`        | Highly significant tasks that require special review or coordination.          |
| `duplicate`                  | **Gray**         | `duplicate`          | Identifies another issue covering the exact same subject.                      |
| `invalid`                    | **Light Gray**   | `invalid`            | The issue does not follow templates, cannot be reproduced, or is out of scope. |
| `wontfix`                    | **Charcoal**     | `wontfix`            | Decision made to not implement this feature or fix.                            |

---

## 🔄 Issue Status

Tracks the workflow progress of an issue.

| Label          | Color             | Description                                                                  |
| :------------- | :---------------- | :--------------------------------------------------------------------------- |
| `in-progress`  | **Green**         | Someone is actively working on this issue. Please do not request assignment. |
| `blocked`      | **Red-Black**     | Depends on another pending issue, pull request, or maintainer approval.      |
| `needs-review` | **Yellow-Orange** | Development work is complete, and the Pull Request is under review.          |
| `help wanted`  | **Teal**          | Open for anyone to claim! Ready to be picked up.                             |

---

## 🔍 How to Filter Issues on GitHub

You can combine these labels in the GitHub Search Bar to find your ideal issue.

- **To find beginner-friendly frontend tasks:**
  ```text
  is:issue is:open label:"good first issue" label:frontend
  ```
- **To find help-wanted backend bugs:**
  ```text
  is:issue is:open label:"help wanted" label:backend label:bug
  ```
- **To see issues ready for you to pick up:**
  ```text
  is:issue is:open label:"help wanted" -label:in-progress -label:blocked
  ```

---

> [!TIP]
> **Ready to pick an issue?** Head over to the [GitHub Issue Tracker](https://github.com/NITRR-Official/CampusOS/issues) and filter by the labels above!

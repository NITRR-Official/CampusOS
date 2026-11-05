# Landing Page Design Spec

This is the UI/UX design for the public landing page at `/` (issue #60). It starts from the page that already exists in `frontend/app/page.tsx` and says what to keep, what to add, and how each section should behave. It is a design and planning document only: implementation, animations, and component work are handled in separate issues.

Related docs: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [DARK_MODE.md](./DARK_MODE.md), [OVERVIEW.md](./OVERVIEW.md).

## 1. UI/UX Direction

### Audience

The page has three readers, in this order of priority:

1. **Campus staff and student leaders** deciding whether CampusOS fits how their institute, clubs, and events run.
2. **Developers and contributors** checking whether the project is open, modular, and easy to join.
3. **Existing users** who only need the way into the app (Login or Dashboard).

### What the page must communicate

Each goal from #60 maps to the section that carries it:

| Goal                          | Carried by                                          |
| ----------------------------- | --------------------------------------------------- |
| CampusOS vision               | Hero                                                |
| Modular architecture          | Modular architecture (`#modules`)                   |
| Workflow capabilities         | Workflow and planning (`#workflow`)                 |
| Organizational planning       | Calendar and operational intelligence (`#calendar`) |
| Open-source ecosystem         | Open source and community (`#open-source`)          |
| Contributor friendliness      | Contributor onboarding (`#contribute`)              |
| Scalability and extensibility | Modular architecture, Launch CTA (`#launch`)        |

### Tone and feel

- **Modern and modular:** content sits in cards on a quiet grid background, the way the current page already does it. Each section is a self-contained block, so new sections can be added without reflowing the others.
- **Collaborative:** copy talks about teams, clubs, and contributors, not single users.
- **Developer-friendly:** the open-source and contributor sections use plain language and link straight to the repo and docs, with no marketing gate in front of them.
- **Operationally intelligent:** show real workflows (approvals, schedules, bookings), not abstract claims.

### Principles

1. **Only claim what exists.** Every number and feature on the page must be true of the codebase at the time it ships. No invented metrics (see [Stat tiles](#stat-tiles)).
2. **One idea per section.** Each section has one heading, one supporting paragraph, and one group of cards or steps.
3. **Two paths, always visible.** Every screen has a way to try the product (Get started / Dashboard) and, from the open-source section down, a way to contribute.
4. **Keep the layers separate.** Design-system primitives come from `@campusos/design-system`, page sections are page components, and animations are an optional layer on top (see [Interaction ideas](#interaction-ideas-not-required)).

## 2. Section Hierarchy

The page runs top to bottom in this order. "Existing" sections stay, with the changes listed. "New" sections do not exist on the page yet.

| #   | Section                               | Anchor         | Status   | Heading level |
| --- | ------------------------------------- | -------------- | -------- | ------------- |
| 0   | Header and navigation                 | none           | Existing | none          |
| 1   | Hero                                  | none           | Existing | `h1`          |
| 2   | Feature highlights                    | `#features`    | Existing | `h2`          |
| 3   | Modular architecture                  | `#modules`     | Existing | `h2`          |
| 4   | Workflow and planning                 | `#workflow`    | Existing | `h2`          |
| 5   | Calendar and operational intelligence | `#calendar`    | New      | `h2`          |
| 6   | Open source and community             | `#open-source` | New      | `h2`          |
| 7   | Contributor onboarding                | `#contribute`  | New      | `h2`          |
| 8   | Launch CTA                            | `#launch`      | Existing | `h2`          |
| 9   | Footer                                | none           | Existing | none          |

The order follows the readers in [Audience](#audience): product value first (1–5), then the open-source story for contributors (6–7), then one closing call to action (8).

The wireframes below are low fidelity. Boxes show grouping and order, not exact size.

### 2.0 Header and navigation

**Goal:** get any reader to any section, or into the app, in one click.

**Content:** the CampusOS wordmark ("Operating system for campuses"), nav links, the theme toggle, and the auth buttons (Login / Get started, or Dashboard when signed in, as today).

**Changes:** the nav gets two more links, so it reads Platform, Modules, Workflow, Calendar, Open source, Launch. "Contribute" is reached from inside Open source, which keeps the bar to six links. Below `lg` the links move into a menu (see [Responsive Behavior](#3-responsive-behavior)).

```text
+------------------------------------------------------------------------+
| [CampusOS]   Platform Modules Workflow Calendar Open source Launch     |
|                                         [theme] [Login] [Get started]  |
+------------------------------------------------------------------------+
```

### 2.1 Hero

**Goal:** say what CampusOS is in one line and give a way in.

**Content:**

- Badge: "CampusOS Platform" (keep).
- `h1`: "Campus operations, finally in sync." (keep).
- Supporting paragraph (keep).
- Actions from `LandingHeroActions` (keep).
- Stat tiles: change to facts from the repo, per [Stat tiles](#stat-tiles).
- Right column: the "Campus pulse" preview card and the two small cards (keep). The numbers in "Campus pulse" ("6 pending reviews", "18 spaces") are example data, so add a visible "Example" label to the card.

```text
+-----------------------------------+  +-----------------------------+
| (o) CAMPUSOS PLATFORM             |  | Campus pulse      [Example] |
| Campus operations,                |  |  - Event approvals          |
| finally in sync.                  |  |  - Resource bookings        |
| Supporting paragraph...           |  |  - New member requests      |
| [Get started] [Login]             |  +-----------------------------+
| +------+ +------+ +------+ +-----+|  +------------+ +--------------+
| | fact | | fact | | fact | | fact||  | Command map| | Ready to     |
| +------+ +------+ +------+ +-----+|  |            | | scale        |
+-----------------------------------+  +------------+ +--------------+
```

### 2.2 Feature highlights (`#features`)

**Goal:** the four reasons a campus picks CampusOS.

**Content:** keep the eyebrow "Platform pillars", the `h2` "Built for every campus team.", and the four `HIGHLIGHTS` cards (Unified operations, Real-time visibility, Member-first experiences, Secure by default). No change.

```text
PLATFORM PILLARS
Built for every campus team.                    Short supporting line
+-----------------------------+ +-----------------------------+
| [icon] Unified operations   | | [icon] Real-time visibility |
+-----------------------------+ +-----------------------------+
| [icon] Member-first         | | [icon] Secure by default    |
+-----------------------------+ +-----------------------------+
```

### 2.3 Modular architecture (`#modules`)

**Goal:** show that CampusOS is built from plugins that a campus turns on as needed. This is the issue's "Modular architecture showcase" and "Highlight modular plugin architecture".

**Content:**

- Keep the `h2` "Everything your campus runs on." and the four `MODULES` cards.
- Change the left-column copy to explain the plugin model in one or two sentences: each module is a plugin in `plugins/`, managed by the plugin manager, so a campus enables only what it needs and new modules can be added without changing the core.
- Add a "plugin strip" under the cards: a row of small badges, one per plugin module (Events, Calendar, Scheduling, Clubs, Tasks, Resources, Vendors, Budget, Forms, Recruitment, Check-in, ...), ending in a link "See all plugins" to the `plugins/` folder on GitHub.

```text
+-----------------------+  +------------------+ +------------------+
| MODULES               |  | Events and       | | Clubs and        |
| Everything your       |  | calendars        | | communities      |
| campus runs on.       |  +------------------+ +------------------+
| Each module is a      |  | Tasks and        | | Resources and    |
| plugin: enable only   |  | workflows        | | vendors          |
| what you need.        |  +------------------+ +------------------+
+-----------------------+
[Events] [Calendar] [Scheduling] [Clubs] [Tasks] [Budget] ... See all plugins ->
```

### 2.4 Workflow and planning (`#workflow`)

**Goal:** show how a campus gets from setup to results.

**Content:** keep the `h2` "From onboarding to outcomes." and the three `STEPS` (01 Map your campus, 02 Publish workflows, 03 Measure outcomes). No change.

```text
WORKFLOW
From onboarding to outcomes.
+------------------+ +------------------+ +------------------+
| 01               | | 02               | | 03               |
| Map your campus  | | Publish workflows| | Measure outcomes |
+------------------+ +------------------+ +------------------+
```

### 2.5 Calendar and operational intelligence (`#calendar`) (new)

**Goal:** show planning and scheduling as a feature on its own, not as one module card. This covers the issue's "Calendar & operational intelligence showcase" and "Showcase planning and collaboration features".

**Content:**

- Eyebrow "Planning", an `h2` (for example "Plan the whole campus calendar in one place."), and one supporting paragraph.
- Left: a static calendar preview card showing a week with a few events from different clubs and departments, labeled "Example".
- Right: three short feature points, each with an icon, for example shared calendar across teams, event approvals before publishing, and resource and room booking next to events.
- The feature points must describe only what the `calendar`, `event`, and `scheduling` plugins do when this section ships. If a point isn't built yet, leave it out rather than marking it "coming soon".

```text
PLANNING
Plan the whole campus calendar in one place.
+----------------------------------+  - [icon] Shared calendar
| Mon  Tue  Wed  Thu  Fri  [Example]|    across teams
| [Club fair]   [Exam review]      |  - [icon] Approvals before
|        [Dept. meeting]           |    publishing
|                 [Sports night]   |  - [icon] Rooms and resources
+----------------------------------+    booked with the event
```

### 2.6 Open source and community (`#open-source`) (new)

**Goal:** make clear that CampusOS is open source and who builds it.

**Content:**

- Eyebrow "Open source", an `h2` (for example "Built in the open."), and a paragraph saying the project is MIT licensed and developed by NIT Raipur with outside contributors.
- Three fact cards: License (MIT), Code (link to the GitHub repo), and Architecture (link to the docs in `docs/`).
- One primary button, "View on GitHub", and one outline button, "Read the docs".
- No live star or contributor counts in the first version (see [Stat tiles](#stat-tiles) for why).

```text
OPEN SOURCE
Built in the open.
MIT licensed, developed by NIT Raipur and contributors.
+--------------+ +--------------+ +--------------+
| License      | | Code         | | Architecture |
| MIT          | | GitHub repo  | | docs/        |
+--------------+ +--------------+ +--------------+
[View on GitHub]  [Read the docs]
```

### 2.7 Contributor onboarding (`#contribute`) (new)

**Goal:** show a new contributor the exact path to a first PR.

**Content:**

- Eyebrow "Contribute", an `h2` (for example "Your first pull request, in three steps."), and one supporting line.
- Three numbered steps, styled like the Workflow steps so the page stays consistent:
  1. **Set up:** read `docs/contributing/CONTRIBUTING.md` and run the project locally.
  2. **Pick an issue:** browse open issues on GitHub and comment to claim one.
  3. **Open a PR:** branch from `dev`, follow Conventional Commits, and open the PR against `dev`.
- One button, "Read the contributing guide", linking to `CONTRIBUTING.md` on GitHub.

```text
CONTRIBUTE
Your first pull request, in three steps.
+------------------+ +------------------+ +------------------+
| 01 Set up        | | 02 Pick an issue | | 03 Open a PR     |
| CONTRIBUTING.md  | | Claim it in a    | | Branch from dev, |
| + run locally    | | comment          | | PR into dev      |
+------------------+ +------------------+ +------------------+
[Read the contributing guide]
```

### 2.8 Launch CTA (`#launch`)

**Goal:** one closing call to action for campus teams.

**Content:** keep the primary-colored band, the `h2` "Launch your campus OS.", and its copy. Keep "Start free". Rename "Schedule a walk-through" to a label that matches where it goes: it links to `/login` today, so either change the label to "Log in" or point it at a real contact page once one exists. Add one quiet text link under the buttons: "Want to build it with us? Contribute" linking to `#contribute`.

```text
+------------------------------------------------------------------+
| Launch your campus OS.                  [Start free] [Log in]    |
| Start with the modules you need today...                         |
|                                 Want to build it with us? ->     |
+------------------------------------------------------------------+
```

### 2.9 Footer

**Goal:** the last navigation point and project facts.

**Content:** keep the one-line description and the Login / Sign up / Dashboard links. Add a second group of links: GitHub, Docs, Contributing, License (MIT).

```text
---------------------------------------------------------------------
CampusOS - Campus management and community operations.
Product: Login  Sign up  Dashboard    Project: GitHub  Docs  Contributing  MIT
---------------------------------------------------------------------
```

## 3. Responsive Behavior

The page uses Tailwind's default breakpoints, as it does today: `sm` 640px, `md` 768px, `lg` 1024px. Design mobile first: the base layout is one column, and wider screens add columns. Content stays inside `max-w-6xl` with `px-6` side padding at every size.

| Section                | Base (< 640px)                                     | `sm` (≥ 640px)                 | `md` (≥ 768px)          | `lg` (≥ 1024px)                          |
| ---------------------- | -------------------------------------------------- | ------------------------------ | ----------------------- | ---------------------------------------- |
| Header                 | Wordmark, theme toggle, menu button                | Same, plus auth buttons        | Same                    | Full inline nav and auth buttons         |
| Hero                   | One column; stat tiles in 2 columns; preview below | Stat tiles in 4 columns        | Same                    | Two columns: copy left, preview right    |
| Feature highlights     | One column of cards                                | Same                           | 2 columns               | Heading and supporting line side by side |
| Modular architecture   | Heading, then cards in one column; strip wraps     | Cards in 2 columns             | Same                    | Heading column left, cards right         |
| Workflow and planning  | One column of steps                                | Same                           | 3 columns               | Same                                     |
| Calendar (new)         | Feature points first, then preview card            | Same                           | Same                    | Preview left, feature points right       |
| Open source (new)      | One column of fact cards; buttons stack full width | Buttons side by side           | Fact cards in 3 columns | Same                                     |
| Contributor onboarding | One column of steps; button full width             | Same                           | 3 columns               | Same                                     |
| Launch CTA             | Copy, then buttons stacked                         | Buttons side by side           | Same                    | Copy left, buttons right                 |
| Footer                 | Description, then link groups stacked              | Description and links in a row | Same                    | Same                                     |

### Navigation below `lg`

Today the nav links are hidden below `lg` (`hidden lg:flex`), so phone and tablet readers have no way to jump to a section. Below `lg`, show a menu button (icon button with an accessible label "Open menu") that opens the `Sheet` component from `@campusos/design-system` from the right. The sheet lists the same six links in the same order, then the auth buttons. Selecting a link closes the sheet and scrolls to the section.

### Other responsive rules

- Calendar preview: below `md`, show a 3-day view instead of a full week, so event labels stay readable without shrinking the text.
- Plugin strip: badges wrap onto more lines. They never scroll sideways.
- Touch targets: every link and button is at least 44px tall on touch screens (see [Accessibility](#accessibility)).
- Long words: headings use normal word breaking. No text should be cut off with an ellipsis.

## 4. Design-System Direction

Every visual choice below points at an existing rule in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md). This spec adds no new tokens.

### Color palette

Uses "1. Color Palette".

- **Primary (Sky Blue):** primary buttons, links, the Launch CTA band, active nav state. Same as today.
- **Accent (Orange):** "Example" labels on preview cards and the eyebrow dots, which matches its stated use for "badges and tags" and "highlight sections".
- **Secondary (Violet):** not used on the landing page, so the page doesn't carry three brand colors at once.
- **Neutral:** body text, borders, and card backgrounds, through the theme variables the page already uses (`text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`).
- **Semantic colors:** not used. The landing page has no status messages.

### Typography

Uses "2. Typography Scale".

- Hero `h1`: Display Large (`display-lg`, Sora), as today.
- Section `h2`s: the default `h2` style used today. Every new section uses the same style so the page reads as one hierarchy.
- Card and step titles: Heading Small (`h3`).
- Eyebrows ("PLATFORM PILLARS", "OPEN SOURCE"): Label Small, uppercase with wide letter spacing, as today.
- Body copy: Body Medium (Manrope); supporting paragraphs under headings use Body Large.
- File and folder names in the contributor section (`CONTRIBUTING.md`, `dev`): Geist Mono.

### Spacing

Uses "3. Spacing System". Sections keep the current vertical padding (`py-16`, which is 3xl at 64px). Card grids use `gap-6` (md, 24px) as today. Inside cards, use md padding.

### Border radius

Uses "4. Border Radius". Cards use lg (16px), buttons use md, badges in the plugin strip use full. The Launch CTA band keeps its larger rounded container.

### Shadows

Uses "5. Shadow System". Cards use sm. Only the hero "Campus pulse" card and the Launch CTA band use lg, so at most two elements on the page stand out.

### Components

Uses "6. Component Usage Guidelines". Build every section from existing `@campusos/design-system` components:

| Need                          | Component                                                           |
| ----------------------------- | ------------------------------------------------------------------- |
| Buttons and CTAs              | `Button` (default, `outline`)                                       |
| Feature, fact, and step cards | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` |
| Plugin strip, "Example" tags  | `Badge`                                                             |
| Mobile navigation             | `Sheet`                                                             |
| Footer divider                | `Separator`                                                         |

Icons come from `lucide-react`, which the page already uses.

### Dark mode

Uses "7. Dark Mode" and [DARK_MODE.md](./DARK_MODE.md). Use theme variables (`bg-background`, `bg-card`, `text-foreground`, `border-border`) rather than fixed colors, so every new section switches with the existing `ThemeToggle`. The calendar preview's event chips need a check in both themes, since they are the only new colored blocks.

### Accessibility

Uses "8. Accessibility Considerations".

- Text meets WCAG AA contrast (4.5:1 for body text) in both themes, including text on the primary Launch CTA band.
- Every interactive element has a visible 2px focus ring.
- Touch targets are at least 44px.
- One `h1`, then one `h2` per section in page order, then `h3` for cards, with no skipped levels.
- Preview cards with example data are labeled "Example" in text, not only by color.
- The mobile menu button has an accessible name, and the sheet traps focus while open.

## 5. Implementation-Ready Decisions

### Per-section decisions

| Section                | Anchor         | Components                       | Content source                                            |
| ---------------------- | -------------- | -------------------------------- | --------------------------------------------------------- |
| Header                 | none           | `Button`, `Sheet`, `ThemeToggle` | Nav links in `LandingHeader.tsx`                          |
| Hero                   | none           | `Button`, `Card`, `Badge`        | Stat tiles move to a `STATS` array at the top of the page |
| Feature highlights     | `#features`    | `Card`                           | Existing `HIGHLIGHTS` array                               |
| Modular architecture   | `#modules`     | `Card`, `Badge`                  | Existing `MODULES` array, plus a new `PLUGINS` array      |
| Workflow and planning  | `#workflow`    | `Card`-style steps               | Existing `STEPS` array                                    |
| Calendar               | `#calendar`    | `Card`, `Badge`                  | New `CALENDAR_POINTS` array                               |
| Open source            | `#open-source` | `Card`, `Button`                 | New `OPEN_SOURCE_FACTS` array                             |
| Contributor onboarding | `#contribute`  | `Card`-style steps, `Button`     | New `CONTRIBUTE_STEPS` array                              |
| Launch CTA             | `#launch`      | `Button`                         | Inline, as today                                          |
| Footer                 | none           | `Separator`                      | Inline, as today, plus a project link group               |

Content keeps the current pattern: each section's cards come from a constant array at the top of `page.tsx`, so copy changes don't touch layout code. The nav links in `LandingHeader.tsx` and the section anchors must stay in sync; listing them once in a shared constant would stop them drifting apart.

### Stat tiles

Decision: **replace the four hero stat tiles with facts that are true of the repo.** Today they show "12+ Active modules", "40+ Teams onboarded", "120+ Automations", and "99.9% Uptime", which are hard-coded with no data source behind them. The replacements:

| Label        | Value                                      | Source                                                        |
| ------------ | ------------------------------------------ | ------------------------------------------------------------- |
| Plugins      | The number of plugin folders in `plugins/` | Count at build time, or update by hand when a plugin is added |
| License      | MIT                                        | `LICENSE`                                                     |
| Built with   | Next.js + Node                             | `frontend/`, `backend/`                                       |
| Contributing | Open, PRs into `dev`                       | `CONTRIBUTING.md`                                             |

If the team later wants usage numbers (teams onboarded, uptime), they come back only when there's a real data source for them.

### Links

- GitHub repo: `https://github.com/NITRR-Official/CampusOS`
- Contributing guide: `docs/contributing/CONTRIBUTING.md` on the `dev` branch
- Plugins: the `plugins/` folder on GitHub
- License: `LICENSE`

### Interaction ideas (not required)

These are optional ideas for the separate animation work. Nothing in this spec depends on them.

- Fade sections in as they scroll into view, with no motion when the reader has `prefers-reduced-motion` set.
- Highlight the nav link for the section currently on screen.
- Hovering a badge in the plugin strip shows a one-line description of that plugin.

### Left for the implementation issue

- Building the three new sections and the mobile `Sheet` menu.
- Updating the nav links, hero stat tiles, Launch CTA label, and footer links.
- Writing the final copy for the new sections' headings and feature points, checked against what the `calendar`, `event`, and `scheduling` plugins actually do at that time.
- Checking contrast in both themes for the calendar preview's event chips.
- Any animation from [Interaction ideas](#interaction-ideas-not-required).

---
description: "Frontend development with Next.js, React, Tailwind CSS, shadcn/ui. Apply when building UI components, working with the App Router, styling with Tailwind, managing forms, or implementing frontend patterns in CampusOS."
trigger: model_decision
---

# Frontend Engineer Rules

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.2 | Framework — App Router, SSR, file-based routing |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | 4.6.0 | Pre-built UI components |
| react-hook-form | 7.x | Form state management |
| Zod | 3.x | Schema validation |
| Lucide React | 1.x | Icon library |

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router (pages and layouts)
│   ├── layout.tsx          # Root layout — Geist fonts, ThemeProvider
│   ├── page.tsx            # Dashboard page
│   ├── globals.css         # Global styles + Tailwind + CSS variables
│   └── <route>/            # Feature pages
├── components/             # Shared components
│   ├── ThemeToggle.tsx     # Dark/light mode toggle
│   └── ui/                 # shadcn/ui components
└── lib/                    # API clients and utilities
    ├── <domain>-api.ts     # API clients using fetch
    ├── auth-session.ts     # JWT token storage (localStorage)
    ├── theme-provider.tsx  # Dark mode context
    ├── utils.ts            # cn() utility
    └── validations/        # Zod schemas
```

## API Client Pattern

API clients use `fetch` directly (not Axios):

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options
  });
  if (!response.ok) throw new ApiError(/* ... */);
  return response.json();
}
```

- Backend URL: `http://localhost:4000` (not 3000)
- Authenticated requests read token from `localStorage` via `readAccessToken()` in `lib/auth-session.ts`

## Styling Rules

- **Tailwind CSS v4** for utility classes
- **CSS variables** in `globals.css` for theming (light/dark mode)
- **shadcn/ui** components in `components/ui/` — installed via shadcn CLI
- **`cn()` utility** from `lib/utils.ts` — merges classes with `clsx` + `tailwind-merge`
- Never use CSS Modules for new components — use Tailwind exclusively

## Component Rules

- Use **Geist** font family (`--font-geist-sans`, `--font-geist-mono`)
- Use `'use client'` directive only for interactive components
- Default components are Server Components (App Router)
- Forms use `react-hook-form` + `zodResolver(schema)` + shadcn `<Form>` wrapper

## Design System

Follow `docs/frontend/DESIGN_SYSTEM.md`:
- Primary: Sky Blue (#0ea5e9)
- Secondary: Violet (#8b5cf6)
- Accent: Orange (#f97316)
- 8px base spacing system
- shadcn/ui `Button`, `Card`, `Dialog`, `Form`, `Input`, `Toast` components

## Development Commands

```bash
cd frontend
pnpm dev          # Start dev server (port 3000, webpack bundler)
pnpm build        # Production build
pnpm lint         # ESLint
```

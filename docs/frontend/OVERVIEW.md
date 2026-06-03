# Frontend Overview

The CampusOS frontend is a Next.js 16 application using the App Router, React 19, TypeScript, and Tailwind CSS v4.

## Tech Stack (actual `package.json`)

| Technology      | Version | Purpose                                                     |
| --------------- | ------- | ----------------------------------------------------------- |
| Next.js         | 16.2.2  | Framework — App Router, SSR, file-based routing             |
| React           | 19.2.4  | UI library                                                  |
| TypeScript      | 5.x     | Type safety                                                 |
| Tailwind CSS    | 4.x     | Utility-first styling                                       |
| shadcn/ui       | 4.6.0   | Pre-built UI components (Button, Card, Dialog, Toast, etc.) |
| Radix UI        | —       | Accessible primitives (under shadcn/ui)                     |
| react-hook-form | 7.x     | Form state management                                       |
| Zod             | 3.x     | Schema validation                                           |
| Axios           | 1.x     | HTTP client (available, but API clients use `fetch`)        |
| Lucide React    | 1.x     | Icon library                                                |

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router (pages and layouts)
│   ├── layout.tsx         # Root layout — Manrope + Sora + Geist Mono, ThemeProvider
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles + Tailwind + CSS variables
│   ├── login/             # Login page
│   ├── signup/            # Registration page
│   ├── forgot-password/   # Password reset
│   ├── events/            # Event management pages
│   ├── tasks/             # Task management pages
│   ├── calendar/          # Calendar view
│   ├── vendors/           # Vendor management pages
│   ├── resources/         # Resource management pages
│   ├── participants/      # Participant dashboard
│   └── components/        # Page-level components
│
├── components/             # Shared components
│   ├── ThemeToggle.tsx    # Dark/light mode toggle
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── toast.tsx
│
└── lib/                    # API clients and utilities
    ├── auth-api.ts        # Login/signup API calls
    ├── auth-session.ts    # JWT token storage (localStorage)
    ├── event-api.ts       # Event endpoints
    ├── task-api.ts        # Task endpoints
    ├── calendar-api.ts    # Calendar endpoints
    ├── checkin-api.ts     # Check-in endpoints
    ├── vendor-api.ts      # Vendor endpoints
    ├── resource-api.ts    # Resource endpoints
    ├── scheduling-api.ts  # Scheduling endpoints
    ├── budget-api.ts      # Budget endpoints
    ├── theme-provider.tsx # Dark mode context provider
    ├── utils.ts           # cn() utility for class merging
    └── validations/       # Zod schemas for form validation
```

## How API Calls Work

The frontend uses a centralized `apiClient` located in `lib/api/client.ts`. This wrapper automatically prepends the backend's base URL, handles global error parsing via the `ApiError` class, and injects the JWT access token into the `Authorization` header.

Every backend domain has a corresponding API service file in `lib/` that utilizes this client:

```typescript
// lib/auth-api.ts — simplified
import { apiClient } from './api/client';
export { ApiError } from './api/errors';

export function login(payload: { email: string; password: string }) {
  return apiClient.post<AuthResponseData>('/api/v1/auth/login', payload);
}
```

### Authentication Token Injection

For authenticated endpoints, the token is automatically read from cookies or `localStorage` via `readAccessToken()` in `lib/auth-session.ts` and injected into the request headers by the `apiClient`.

If you are calling an API from a **Server Component**, you can explicitly pass the token into the options:

```typescript
// Example usage in a Server Component
const token = cookies().get('campusos_access_token')?.value;
const tasks = await fetchTasks(token);
```

## Styling

- **Tailwind CSS v4** for utility classes
- **CSS variables** in `globals.css` for theming (light/dark mode)
- **shadcn/ui** for consistent UI components — these live in `components/ui/` and are installed via the shadcn CLI
- **`cn()` utility** from `lib/utils.ts` — merges Tailwind classes with `clsx` + `tailwind-merge`

## Fonts

The app uses a modern pairing loaded via `next/font/google`:

- `Manrope` (sans-serif) — mapped to `--font-manrope`
- `Sora` (display/headings) — mapped to `--font-sora`
- `Geist Mono` (monospace) — mapped to `--font-geist-mono`

## Theme System

Dark mode is managed by a custom `ThemeProvider` in `lib/theme-provider.tsx`:

- Wraps the entire app at the layout level
- Toggle via `ThemeToggle.tsx` component
- Uses CSS variables for color scheme switching

## Forms

Forms use `react-hook-form` + `Zod` for validation:

- Form state handled by `useForm()` from react-hook-form
- Schema validation with `zodResolver(schema)`
- shadcn/ui `<Form>` wrapper components for consistent field rendering

## Development Commands

```bash
cd frontend

pnpm dev          # Start dev server (port 3000, webpack bundler)
pnpm build        # Production build
pnpm lint         # ESLint
```

> **Note**: The default dev command uses webpack (`next dev --webpack`). Turbopack is available via `pnpm dev:turbo` but is not the default.

## Available Pages

| Route              | Purpose                      |
| ------------------ | ---------------------------- |
| `/`                | Landing page                 |
| `/dashboard`       | Dashboard                    |
| `/login`           | User login                   |
| `/signup`          | User registration            |
| `/forgot-password` | Password reset               |
| `/events`          | Event listing and management |
| `/tasks`           | Task management              |
| `/calendar`        | Calendar view                |
| `/vendors`         | Vendor management            |
| `/resources`       | Resource management          |
| `/participants`    | Participant dashboard        |

---

**See Also**: [Design System](./DESIGN_SYSTEM.md) · [Dark Mode](./DARK_MODE.md) · [API Standards](../guides/API_STANDARDS.md)

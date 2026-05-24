---
name: frontend-patterns
description: "Build React components in Next.js using CampusOS patterns. Use when implementing UI components, working with the App Router, styling with Tailwind CSS v4, or managing forms with react-hook-form and Zod."
---

# Frontend Patterns

## When to Use

- Building new React components or pages
- Working with Next.js App Router
- Styling with Tailwind CSS v4 and shadcn/ui
- Creating forms with react-hook-form + Zod
- Connecting to backend API

## Procedure

### 1. Component Structure

Components live in `frontend/components/` (shared) or `frontend/app/components/` (page-level):

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EventCardProps {
  title: string;
  status: 'draft' | 'published';
}

export function EventCard({ title, status }: EventCardProps) {
  return (
    <div className={cn("rounded-lg p-6 shadow-sm", "bg-white dark:bg-neutral-900")}>
      <h3>{title}</h3>
      <span className="text-sm text-neutral-500">{status}</span>
    </div>
  );
}
```

### 2. Server vs Client Components

```tsx
// Server Component (default — no directive needed)
export default async function EventsPage() {
  const events = await fetchEvents();
  return <EventList events={events} />;
}

// Client Component (needs 'use client' directive)
'use client';
export function EventFilter({ onFilter }: { onFilter: (q: string) => void }) {
  return <input onChange={(e) => onFilter(e.target.value)} />;
}
```

### 3. API Client Pattern

API clients in `frontend/lib/` use `fetch` (not Axios):

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function getEvents() {
  const response = await fetch(`${API_BASE_URL}/api/v1/events`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return response.json();
}
```

### 4. Styling

- **Tailwind CSS v4** for utility classes
- **shadcn/ui** components: `Button`, `Card`, `Dialog`, `Form`, `Input`, `Toast`
- **`cn()` utility** from `lib/utils.ts` — merges classes with `clsx` + `tailwind-merge`
- **CSS variables** in `globals.css` for theming (light/dark mode)
- **Geist fonts** via `next/font/google`

### 5. Forms

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export function LoginForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  // Use shadcn/ui <Form> wrapper for consistent rendering
}
```

## Quick Reference

```bash
cd frontend
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Hydration mismatch | Add `'use client'` to interactive components |
| API URL wrong | Backend is port 4000: `NEXT_PUBLIC_API_BASE_URL` |
| Styling not applied | Check Tailwind CSS v4 config in `globals.css` |
| Form not validating | Ensure `zodResolver(schema)` passed to `useForm` |

---
name: frontend-patterns
description: 'Build React components in Next.js using CampusOS patterns. Use when: implementing new UI modules, refactoring existing components, setting up state management, optimizing component performance.'
---

# Frontend Patterns

## When to Use

- Building new React components or pages
- Refactoring components for reusability
- Setting up state with Zustand or Context API
- Applying styling (Tailwind/CSS Modules)
- Optimizing performance (memoization, code splitting)

## Procedure

### 1. Component Structure

Create modular components in `src/components/<domain>/`:

```tsx
// src/components/Course/CourseCard.tsx
import { memo } from 'react';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  id: string;
  title: string;
  enrolled?: boolean;
}

export const CourseCard = memo(function CourseCard({
  id,
  title,
  enrolled = false
}: CourseCardProps) {
  return (
    <div className={styles.card}>
      <h3>{title}</h3>
      {enrolled && <span className={styles.badge}>Enrolled</span>}
    </div>
  );
});
```

### 2. State Management with Zustand

```tsx
// src/stores/courseStore.ts
import { create } from 'zustand';

export const useCourseStore = create((set) => ({
  courses: [],
  setCourses: (courses) => set({ courses }),
  addCourse: (course) => set((s) => ({ courses: [...s.courses, course] }))
}));
```

### 3. Server/Client Components

```tsx
// Server Component (default in App Router)
export async function CoursesPage() {
  const courses = await fetchCourses();
  return <CourseList courses={courses} />;
}

// Client Component
('use client');
export function CourseFilter({ onFilter }) {
  return <input onChange={(e) => onFilter(e.target.value)} />;
}
```

### 4. Styling with Tailwind + CSS Modules

Use Tailwind for utilities, CSS Modules for scoped styles:

```tsx
// src/components/Button/Button.tsx
import styles from './Button.module.css';

export function Button({ children, variant = 'primary' }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

### 5. Code Splitting & Dynamic Imports

```tsx
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/Admin/Panel'), {
  loading: () => <div>Loading...</div>
});
```

### 6. Performance Optimization

Use memoization and useCallback:

```tsx
'use client';
import { useMemo, useCallback } from 'react';

export function EnrollmentForm({ courses }) {
  const active = useMemo(() => courses.filter((c) => c.active), [courses]);
  const enroll = useCallback((id) => {
    /* enroll */
  }, []);
  return <form onSubmit={() => enroll()} />;
}
```

## Quick Reference

```bash
pnpm dev              # Start frontend
pnpm build            # Production build
pnpm type-check       # Type validation
pnpm lint            # Code quality
```

## Common Issues

| Issue                          | Solution                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Hydration mismatch             | Ensure 'use client' in client components. Use dynamic imports with `ssr: false`. |
| Slow page load                 | Use dynamic imports for below-fold components. Optimize images with next/image.  |
| State persisting across routes | Clear store on logout: `store.clear()`. Use session storage for temporary state. |
| CSS conflicts                  | CSS Modules scope by default. Avoid global styles in components. Use BEM naming. |

# Dark Mode Implementation Guide

## Overview

Dark mode is now fully integrated into the CampusOS frontend. The implementation uses a React Context-based theme provider with persistent localStorage support and system preference detection.

## How It Works

### Theme Provider
The `ThemeProvider` component manages the application's theme state and handles:
- **Persistence**: Theme preference is saved to localStorage
- **System Preference Detection**: If no stored preference exists, the system's dark mode preference is detected and applied
- **Hydration Safety**: Prevents hydration mismatches in Next.js by handling theme application after mount

### Theme Toggle Component
The `ThemeToggle` component provides a user interface for switching between light and dark modes. It displays:
- Sun icon (☀️) in dark mode
- Moon icon (🌙) in light mode

## Usage

### Using the Theme Hook

```tsx
'use client';

import { useTheme } from '@/lib/theme-provider';

export function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}
```

### Adding the Theme Toggle to Your Layout

```tsx
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  return (
    <header>
      <h1>CampusOS</h1>
      <ThemeToggle />
    </header>
  );
}
```

## Styling Components for Dark Mode

All components should support both light and dark themes. Use Tailwind's `dark:` prefix to apply dark mode styles:

```tsx
// Simple element
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
  Content
</div>

// Using design system colors
<button className="bg-primary-500 dark:bg-primary-600 text-primary-foreground">
  Click me
</button>

// Card component
<div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md dark:shadow-lg p-md">
  <h2 className="text-neutral-900 dark:text-neutral-50">Card Title</h2>
  <p className="text-neutral-700 dark:text-neutral-300">Card content</p>
</div>
```

## CSS Variables

Dark mode colors are defined using CSS variables in `globals.css`. These variables are automatically switched when the theme changes:

```css
/* Light Mode */
:root {
  --background: oklch(1 0 0);           /* White background */
  --foreground: oklch(0.145 0 0);       /* Dark text */
  --primary: oklch(0.205 0 0);          /* Dark blue */
  /* ... more variables ... */
}

/* Dark Mode */
.dark {
  --background: oklch(0.145 0 0);       /* Dark background */
  --foreground: oklch(0.985 0 0);       /* Light text */
  --primary: oklch(0.922 0 0);          /* Light blue */
  /* ... more variables ... */
}
```

## Theme Persistence

The theme preference is automatically saved to localStorage when changed. On the next visit, the application will use the previously selected theme.

```javascript
// Manually access stored theme
const savedTheme = localStorage.getItem('theme');
```

## System Preference Detection

If no theme is stored, the application will check the user's system preference:

```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

## Best Practices

### 1. Always Use Tailwind Dark Mode Classes
```tsx
// ✅ Good
<div className="bg-white dark:bg-neutral-900" />

// ❌ Avoid
<div style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }} />
```

### 2. Use Design System Colors
Refer to the design system documentation for consistent color usage:
```tsx
// ✅ Use design system colors
<div className="bg-primary-50 dark:bg-primary-950">

// ✅ Use semantic colors for status
<div className="bg-success-50 dark:bg-success-950">
```

### 3. Test Both Themes
Always test your components in both light and dark modes to ensure:
- Text contrast meets accessibility standards
- All interactive elements are visible
- Colors are semantically appropriate

### 4. Use Proper Text Colors
```tsx
// ✅ Good contrast in both themes
<p className="text-neutral-700 dark:text-neutral-300">
  Body text

// ❌ Poor contrast
<p className="text-neutral-600 dark:text-neutral-600">
  Hard to read in dark mode
</p>
```

## Accessibility Considerations

### Color Contrast
- Light theme text: `text-neutral-700` (dark gray on white)
- Dark theme text: `text-neutral-300` (light gray on dark background)
- Both meet WCAG AA standards (4.5:1 ratio)

### Focus Indicators
Dark mode includes proper focus states with high contrast rings:
```tsx
<button className="focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400">
  Accessible button
</button>
```

## Debugging

### Check Current Theme
```tsx
const { theme } = useTheme();
console.log('Current theme:', theme);
```

### Force a Theme
```tsx
const { setTheme } = useTheme();
setTheme('dark'); // Force dark mode
```

### Check localStorage
```javascript
console.log('Stored theme:', localStorage.getItem('theme'));
```

## Browser Support

Dark mode is supported in all modern browsers:
- Chrome 76+
- Firefox 67+
- Safari 12.1+
- Edge 79+

## Future Enhancements

- [ ] Add theme schedule (e.g., auto-switch at sunset)
- [ ] Additional theme options (e.g., high contrast)
- [ ] Per-page theme overrides
- [ ] Theme sync across tabs
- [ ] Custom color palette support

## Resources

- [Next.js Dark Mode](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css#dark-mode)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS Variables in Dark Mode](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)

---

**Last Updated**: May 2, 2026  
**Maintained By**: CampusOS Team

# CampusOS Design System

This document outlines the foundational design system for the CampusOS frontend. All components and pages should follow these guidelines to ensure consistency across the application.

## 1. Color Palette

### Primary Colors
Used for primary actions, key UI elements, and main brand identity.

```
Primary (Sky Blue)
- 50: #f0f9ff
- 100: #e0f2fe
- 200: #bae6fd
- 300: #7dd3fc
- 400: #38bdf8
- 500: #0ea5e9 ← Main Primary Color
- 600: #0284c7
- 700: #0369a1
- 800: #075985
- 900: #0c3d66
```

**Usage:**
- Primary buttons
- Links and hover states
- Active tabs
- Primary input focus states
- Primary brand elements

### Secondary Colors
Used for secondary actions and supporting UI elements.

```
Secondary (Violet)
- 50: #f5f3ff
- 100: #ede9fe
- 200: #ddd6fe
- 300: #c4b5fd
- 400: #a78bfa
- 500: #8b5cf6 ← Main Secondary Color
- 600: #7c3aed
- 700: #6d28d9
- 800: #5b21b6
- 900: #4c1d95
```

**Usage:**
- Secondary buttons
- Supporting actions
- Alternative highlights
- Secondary branding elements

### Accent Colors
Used for highlights, important information, and attention-grabbing elements.

```
Accent (Orange)
- 50: #fef3c7
- 100: #fde68a
- 200: #fcd34d
- 300: #fbbf24
- 400: #f59e0b
- 500: #f97316 ← Main Accent Color
- 600: #ea580c
- 700: #c2410c
- 800: #92400e
- 900: #78350f
```

**Usage:**
- Badges and tags
- Callout boxes
- Highlight sections
- Important notifications
- Featured content

### Semantic Colors

#### Success (Green)
```
500: #22c55e ← Main Success Color
Used for: Success messages, confirmed states, positive actions
```

#### Warning (Amber)
```
500: #f59e0b ← Main Warning Color
Used for: Warning messages, cautionary alerts, pending states
```

#### Error (Red)
```
500: #ef4444 ← Main Error Color
Used for: Error messages, validation errors, dangerous actions
```

#### Info (Sky Blue)
```
500: #0ea5e9 ← Main Info Color
Used for: Informational messages, tips, helpful information
```

### Neutral Colors
Used for text, borders, backgrounds, and general UI elements.

```
Neutral Gray Scale
- 50: #f9fafb (Off-white background)
- 100: #f3f4f6
- 200: #e5e7eb
- 300: #d1d5db (Light borders)
- 400: #9ca3af
- 500: #6b7280 (Secondary text)
- 600: #4b5563
- 700: #374151
- 800: #1f2937 (Primary text)
- 900: #111827
- 950: #030712 (Near black)
```

**Usage:**
- Body text: 700 (light) / 200 (dark mode)
- Secondary text: 600 (light) / 300 (dark mode)
- Borders: 200 (light) / 700 (dark mode)
- Backgrounds: 50 (light) / 950 (dark mode)

## 2. Typography Scale

### Heading Scale

| Name | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| Display Large | 3.5rem | 700 | 1.1 | Page hero/main title |
| Display Medium | 3rem | 700 | 1.15 | Large page headers |
| Display Small | 2.5rem | 700 | 1.2 | Section headers |
| Heading Large | 2rem | 700 | 1.3 | Page titles (`<h1>`) |
| Heading Medium | 1.5rem | 600 | 1.4 | Subsection titles (`<h2>`) |
| Heading Small | 1.25rem | 600 | 1.5 | Small section titles (`<h3>`) |
| Heading XS | 1.125rem | 600 | 1.6 | Subsection (`<h4>`) |

### Body Text Scale

| Name | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| Body Large | 1.125rem | 400 | 1.6 | Large body text |
| Body Medium | 1rem | 400 | 1.6 | Standard body text (`<p>`) |
| Body Small | 0.875rem | 400 | 1.5 | Small body text |
| Body XS | 0.8125rem | 400 | 1.5 | Extra small text |

### Label & Caption Scale

| Name | Size | Weight | Line Height | Use Case |
|------|------|--------|-------------|----------|
| Label Large | 1rem | 600 | 1.5 | Form labels, buttons |
| Label Medium | 0.875rem | 600 | 1.5 | Standard labels |
| Label Small | 0.8125rem | 600 | 1.5 | Small labels |
| Caption Medium | 0.875rem | 400 | 1.4 | Helper text, captions |
| Caption Small | 0.8125rem | 400 | 1.4 | Extra small captions |

### Using Typography Classes

```tsx
// Display Styles
<h1 className="display-lg">Hero Title</h1>

// Heading Styles (use HTML heading tags)
<h1>Page Title</h1>
<h2>Section Title</h2>

// Body Styles (default on p)
<p>Standard paragraph text</p>
<small>Small text</small>

// Use specific font sizes when needed
<div className="text-heading-md">Custom heading</div>
<div className="text-body-sm">Small body text</div>
<div className="text-label-md">Form label</div>
```

## 3. Spacing System

We use an 8px base unit system for consistent spacing:

| Token | Value | Pixels | Use Case |
|-------|-------|--------|----------|
| xs | 0.5rem | 8px | Small gaps between elements |
| sm | 1rem | 16px | Standard padding, small margins |
| md | 1.5rem | 24px | Component padding, section spacing |
| lg | 2rem | 32px | Large component padding, section gaps |
| xl | 2.5rem | 40px | Large section spacing |
| 2xl | 3rem | 48px | Major section breaks |
| 3xl | 4rem | 64px | Large page sections |

### Spacing Utility Classes

```tsx
// Padding
<div className="p-md">24px padding all sides</div>
<div className="px-lg py-md">32px horizontal, 24px vertical</div>

// Margins
<div className="m-sm">16px margin</div>
<div className="mb-lg">32px margin-bottom</div>

// Gaps (Flexbox/Grid)
<div className="flex gap-md">Items with 24px gap</div>
<div className="grid grid-cols-3 gap-lg">Grid with 32px gaps</div>
```

## 4. Border Radius

Consistent corner rounding for elements:

| Token | Value | Use Case |
|-------|-------|----------|
| xs | 0.25rem (4px) | Small elements, icons |
| sm | 0.5rem (8px) | Input fields, small components |
| md | 0.75rem (12px) | Cards, buttons (default) |
| lg | 1rem (16px) | Large cards, modals |
| xl | 1.5rem (24px) | Large rounded elements |
| 2xl | 2rem (32px) | Very rounded containers |
| full | 9999px | Circular elements |

### Usage Examples

```tsx
// Buttons (default md)
<button className="rounded-md">Button</button>

// Cards (lg)
<div className="rounded-lg">Card content</div>

// Inputs (sm)
<input className="rounded-sm" />

// Circular elements
<img className="rounded-full" alt="Avatar" />
```

## 5. Shadow System

Consistent depth through shadows:

| Level | Usage |
|-------|-------|
| xs | Subtle elevation for minor interactions |
| sm | Default shadow for cards and buttons |
| md | Slightly elevated components |
| lg | Elevated modals and dropdowns |
| xl | Maximum elevation, floating panels |

```tsx
<div className="shadow-md">Card with medium shadow</div>
<div className="shadow-lg">Modal with large shadow</div>
```

## 6. Component Usage Guidelines

### Buttons

```tsx
import { Button } from "@/components/ui/button";

// Primary button (default)
<Button>Primary Action</Button>

// Secondary button
<Button variant="secondary">Secondary Action</Button>

// Outline button
<Button variant="outline">Outline Action</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Disabled state
<Button disabled>Disabled</Button>

// With size
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Cards

```tsx
<div className="rounded-lg bg-white p-md shadow-sm border border-neutral-200">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>
```

### Form Inputs

```tsx
<input 
  type="text" 
  placeholder="Enter text..."
  className="w-full rounded-sm border border-neutral-300 px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary-500"
/>
```

### Color Usage in Components

```tsx
// Success state
<div className="bg-success-50 border border-success-200 text-success-900">
  Success message
</div>

// Warning state
<div className="bg-warning-50 border border-warning-200 text-warning-900">
  Warning message
</div>

// Error state
<div className="bg-error-50 border border-error-200 text-error-900">
  Error message
</div>

// Info state
<div className="bg-info-50 border border-info-200 text-info-900">
  Info message
</div>
```

## 7. Dark Mode

Dark mode is supported throughout the application. Use the `.dark` class or `dark:` Tailwind modifier:

```tsx
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
  Content that works in both light and dark modes
</div>
```

## 8. Accessibility Considerations

- **Color Contrast**: All text meets WCAG AA standards (4.5:1 for body text)
- **Focus States**: All interactive elements have visible focus indicators (2px ring)
- **Touch Targets**: Minimum 44px touch targets for interactive elements
- **Typography**: Line-height set appropriately for readability (1.4-1.6)

## 9. Component Examples

### Badge Component

```tsx
<span className="inline-flex items-center rounded-full bg-accent-100 px-md py-xs text-label-sm font-medium text-accent-900">
  Badge
</span>
```

### Alert Component

```tsx
<div className="rounded-md bg-success-50 border-l-4 border-success-500 p-md">
  <h4 className="text-label-md font-semibold text-success-900">Success</h4>
  <p className="text-body-sm text-success-800 mt-xs">Your action was successful</p>
</div>
```

## 10. Future Enhancements

This design system is intentionally flexible and will evolve as the project grows. Consider future additions:

- Animation and transition tokens
- Additional semantic colors
- Responsive typography scales
- Component state variations
- Accessibility patterns

## Resources

- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated**: May 2, 2026  
**Maintained By**: CampusOS Team

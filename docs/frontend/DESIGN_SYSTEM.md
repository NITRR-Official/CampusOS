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

### Font Families

- Display/Headings: Sora
- Body: Manrope
- Mono: Geist Mono

### Heading Scale

| Name           | Size     | Weight | Line Height | Use Case                      |
| -------------- | -------- | ------ | ----------- | ----------------------------- |
| Display Large  | 3.5rem   | 700    | 1.1         | Page hero/main title          |
| Display Medium | 3rem     | 700    | 1.15        | Large page headers            |
| Display Small  | 2.5rem   | 700    | 1.2         | Section headers               |
| Heading Large  | 2rem     | 700    | 1.3         | Page titles (`<h1>`)          |
| Heading Medium | 1.5rem   | 600    | 1.4         | Subsection titles (`<h2>`)    |
| Heading Small  | 1.25rem  | 600    | 1.5         | Small section titles (`<h3>`) |
| Heading XS     | 1.125rem | 600    | 1.6         | Subsection (`<h4>`)           |

### Body Text Scale

| Name        | Size      | Weight | Line Height | Use Case                   |
| ----------- | --------- | ------ | ----------- | -------------------------- |
| Body Large  | 1.125rem  | 400    | 1.6         | Large body text            |
| Body Medium | 1rem      | 400    | 1.6         | Standard body text (`<p>`) |
| Body Small  | 0.875rem  | 400    | 1.5         | Small body text            |
| Body XS     | 0.8125rem | 400    | 1.5         | Extra small text           |

### Label & Caption Scale

| Name           | Size      | Weight | Line Height | Use Case              |
| -------------- | --------- | ------ | ----------- | --------------------- |
| Label Large    | 1rem      | 600    | 1.5         | Form labels, buttons  |
| Label Medium   | 0.875rem  | 600    | 1.5         | Standard labels       |
| Label Small    | 0.8125rem | 600    | 1.5         | Small labels          |
| Caption Medium | 0.875rem  | 400    | 1.4         | Helper text, captions |
| Caption Small  | 0.8125rem | 400    | 1.4         | Extra small captions  |

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

| Token | Value  | Pixels | Use Case                              |
| ----- | ------ | ------ | ------------------------------------- |
| xs    | 0.5rem | 8px    | Small gaps between elements           |
| sm    | 1rem   | 16px   | Standard padding, small margins       |
| md    | 1.5rem | 24px   | Component padding, section spacing    |
| lg    | 2rem   | 32px   | Large component padding, section gaps |
| xl    | 2.5rem | 40px   | Large section spacing                 |
| 2xl   | 3rem   | 48px   | Major section breaks                  |
| 3xl   | 4rem   | 64px   | Large page sections                   |

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

| Token | Value          | Use Case                       |
| ----- | -------------- | ------------------------------ |
| xs    | 0.25rem (4px)  | Small elements, icons          |
| sm    | 0.5rem (8px)   | Input fields, small components |
| md    | 0.75rem (12px) | Cards, buttons (default)       |
| lg    | 1rem (16px)    | Large cards, modals            |
| xl    | 1.5rem (24px)  | Large rounded elements         |
| 2xl   | 2rem (32px)    | Very rounded containers        |
| full  | 9999px         | Circular elements              |

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

| Level | Usage                                   |
| ----- | --------------------------------------- |
| xs    | Subtle elevation for minor interactions |
| sm    | Default shadow for cards and buttons    |
| md    | Slightly elevated components            |
| lg    | Elevated modals and dropdowns           |
| xl    | Maximum elevation, floating panels      |

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
  <p className="text-body-sm text-success-800 mt-xs">
    Your action was successful
  </p>
</div>
```

## 10. Plugin Runtime Environment & Design System Exposure (PR #131 / Issue #160)

To allow plugins to render seamless UI widgets without bundling duplicate copies of UI primitives:

1. **Host Runtime Injection**: The host application exposes all 21 `@campusos/design-system` primitives on `window.CampusOS.ui`:
   ```javascript
   window.CampusOS = {
     ui: {
       Avatar,
       Badge,
       Breadcrumb,
       Button,
       Card,
       Checkbox,
       Dialog,
       DropdownMenu,
       Form,
       Input,
       Label,
       ScrollArea,
       Select,
       Separator,
       Sheet,
       Sidebar,
       Skeleton,
       Table,
       Textarea,
       Toast,
       Tooltip
     }
   };
   ```
2. **Build Virtual Module Plugin**: When compiling a plugin's frontend via `scripts/build-plugin-frontend.js`, esbuild shims `@campusos/design-system` with an in-memory virtual module:
   ```javascript
   // Automatically resolved by esbuild during plugin bundling:
   const { Button, Card } = window.CampusOS.ui;
   export { Button, Card };
   ```
3. **Zero Bundle Overhead**: Plugin bundles stay lightweight (< 15KB) and automatically inherit platform dark/light themes, focus rings, and radius variables.

## 11. Complete 21-Component API Reference

All 21 UI components below are exported directly by `@campusos/design-system` and are available both in the core Next.js shell and inside plugin bundles.

### 1. Button

Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.  
Sizes: `default` (h-9), `sm` (h-8), `lg` (h-10), `icon` (size-9).

```tsx
import { Button } from '@campusos/design-system';

<Button variant="outline" size="sm" onClick={() => console.log('Clicked')}>
  Click Me
</Button>;
```

### 2. Badge

Variants: `default`, `secondary`, `destructive`, `outline`.

```tsx
import { Badge } from '@campusos/design-system';

<Badge variant="secondary">Active</Badge>;
```

### 3. Card

Compound components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@campusos/design-system';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting description</CardDescription>
  </CardHeader>
  <CardContent>Body content</CardContent>
</Card>;
```

### 4. Input & Textarea

Standard accessible inputs with focus rings and disabled states.

```tsx
import { Input, Textarea, Label } from '@campusos/design-system';

<Label htmlFor="title">Title</Label>
<Input id="title" placeholder="Enter title" />
<Textarea placeholder="Enter detailed description" rows={3} />
```

### 5. Checkbox

```tsx
import { Checkbox, Label } from '@campusos/design-system';

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms & conditions</Label>
</div>;
```

### 6. Select

Accessible dropdown select powered by Radix UI.

```tsx
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@campusos/design-system';

<Select onValueChange={(val) => console.log(val)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrator</SelectItem>
    <SelectItem value="member">Club Member</SelectItem>
  </SelectContent>
</Select>;
```

### 7. Dialog (Modal)

Compound components: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button
} from '@campusos/design-system';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirmation</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">Are you sure?</p>
  </DialogContent>
</Dialog>;
```

### 8. DropdownMenu

Action menus, overflow menus, and profile triggers.

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button
} from '@campusos/design-system';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      Actions
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => {}}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={() => {}}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

### 9. Sheet (Slide-Over Drawer)

Slide-over panels from `top`, `bottom`, `left`, or `right` side of the viewport.

```tsx
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Button
} from '@campusos/design-system';

<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Drawer</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filter Settings</SheetTitle>
    </SheetHeader>
    <div className="py-4">Filter controls...</div>
  </SheetContent>
</Sheet>;
```

### 10. Table

Data table presentation components: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`.

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@campusos/design-system';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Plugin</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">Events</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

### 11. Toast

Notification system with `useToast` hook.

```tsx
import { useToast, Button } from '@campusos/design-system';

function MyWidget() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() =>
        toast({ title: 'Saved!', description: 'Changes persisted.' })
      }
    >
      Show Toast
    </Button>
  );
}
```

### 12. Tooltip

```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Button
} from '@campusos/design-system';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" size="icon">
        ?
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

### 13. Avatar

User and organization profile pictures with fallback initials.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@campusos/design-system';

<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>;
```

### 14. Breadcrumb

Hierarchical page location trail.

```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@campusos/design-system';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Plugins</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>;
```

### 15. Form

Accessible React Hook Form integration with validation messaging.

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@campusos/design-system';
```

### 16. ScrollArea

Custom scrollbar container for constrained viewports.

```tsx
import { ScrollArea } from '@campusos/design-system';

<ScrollArea className="h-48 w-full rounded-md border p-4">
  Scrollable content...
</ScrollArea>;
```

### 17. Separator

Horizontal or vertical divider rule.

```tsx
import { Separator } from '@campusos/design-system';

<Separator className="my-4" />;
```

### 18. Sidebar

Primary navigation shell with responsive rail and drawer states.

```tsx
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@campusos/design-system';
```

### 19. Skeleton

Loading placeholders for content layouts.

```tsx
import { Skeleton, CardSkeleton } from '@campusos/design-system';

<Skeleton className="h-4 w-32" />
<CardSkeleton />
```

### 20. Label

Accessible HTML form labels.

```tsx
import { Label } from '@campusos/design-system';

<Label htmlFor="email">Email Address</Label>;
```

### 21. ThemeProvider

Context provider managing dark/light modes and CSS variables.

```tsx
import { ThemeProvider } from '@campusos/design-system';
```

## Resources

- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated**: November 2026  
**Maintained By**: CampusOS Core Engineering Team

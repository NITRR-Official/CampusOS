import {
  Users,
  UserPlus,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  ListPlus,
  Ticket,
  Box,
  Activity,
  type LucideIcon
} from 'lucide-react';

/**
 * Maps the string icon names used in mock/API/plugin data to Lucide components.
 * Mirrors the resolution pattern used in `AppSidebar`, keeping data sources
 * serializable and decoupled from component references.
 *
 * Consumers index this map directly (e.g. `dashboardIcons[name] ?? FallbackIcon`)
 * rather than calling a resolver function, which keeps the lint rule
 * `react-hooks/static-components` satisfied.
 */
export const dashboardIcons: Record<string, LucideIcon> = {
  Users,
  UserPlus,
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  ListPlus,
  Ticket,
  Box,
  Activity
};

export const FallbackIcon: LucideIcon = Activity;

export type AccentKey = 'primary' | 'secondary' | 'accent' | 'success';

/** Tailwind classes for the icon "chip" behind each stat / action icon. */
export const accentChipClasses: Record<AccentKey, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-violet-500/10 text-violet-500',
  accent: 'bg-orange-500/10 text-orange-500',
  success: 'bg-emerald-500/10 text-emerald-500'
};

/** Hover treatment for the quick-action icon chip. */
export const accentHoverClasses: Record<AccentKey, string> = {
  primary: 'group-hover:bg-primary group-hover:text-primary-foreground',
  secondary: 'group-hover:bg-violet-500 group-hover:text-white',
  accent: 'group-hover:bg-orange-500 group-hover:text-white',
  success: 'group-hover:bg-emerald-500 group-hover:text-white'
};

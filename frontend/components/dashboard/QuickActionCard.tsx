import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  dashboardIcons,
  FallbackIcon,
  accentHoverClasses,
  type AccentKey
} from './dashboard-ui';

export interface QuickActionData {
  label: string;
  description?: string;
  href: string;
  icon: string;
  accent?: AccentKey;
}

/**
 * A clickable shortcut card. Renders as a link so it works without JavaScript
 * and is keyboard-accessible out of the box. Shared by the dashboard page and
 * plugin widgets for a consistent look and behavior.
 */
export function QuickActionCard({ action }: { action: QuickActionData }) {
  const Icon = dashboardIcons[action.icon] ?? FallbackIcon;
  const accent = action.accent ?? 'primary';

  return (
    <Link
      href={action.href}
      className="group relative flex min-h-[140px] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-6 text-center text-card-foreground shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-background text-foreground shadow-sm transition-colors',
          accentHoverClasses[accent]
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="relative">
        <span className="block text-sm font-semibold tracking-wide text-foreground">
          {action.label}
        </span>
        {action.description ? (
          <span className="mt-1 block text-xs text-muted-foreground">
            {action.description}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

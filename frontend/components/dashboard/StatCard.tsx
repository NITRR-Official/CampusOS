import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  dashboardIcons,
  FallbackIcon,
  accentChipClasses,
  type AccentKey
} from './dashboard-ui';

export interface StatCardData {
  /** Short label shown above the value. */
  label: string;
  /** Pre-formatted display value (string so "1,248" / "12" both work). */
  value: string;
  /** Lucide icon name, resolved via `dashboardIcons`. */
  icon: string;
  accent?: AccentKey;
  /** Optional period-over-period change, e.g. "+12%". */
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * A single dashboard metric card. Presentational and prop-driven so it can be
 * fed by mock data, a real metrics endpoint, or a plugin widget.
 */
export function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = dashboardIcons[stat.icon] ?? FallbackIcon;
  const accent = stat.accent ?? 'primary';
  const isDown = stat.trend === 'down';
  const TrendIcon = isDown ? TrendingDown : TrendingUp;

  return (
    <div className="bg-card/80 backdrop-blur text-card-foreground rounded-xl shadow-sm border border-border/60 p-6 flex items-center gap-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
      <div
        className={cn(
          'flex h-12 w-12 min-w-fit items-center justify-center rounded-xl',
          accentChipClasses[accent]
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </div>

      <div className="flex-1">
        <p className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {stat.label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="m-0 text-2xl md:text-3xl font-bold text-foreground">
            {stat.value}
          </p>
          {stat.change ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                isDown ? 'text-red-500' : 'text-emerald-500'
              )}
            >
              <TrendIcon className="size-3.5" aria-hidden="true" />
              {stat.change}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

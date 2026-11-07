import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

function CardSkeleton({
  className,
  lines = 1,
  showFooter = true,
  ...props
}: React.ComponentProps<'div'> & {
  lines?: number;
  showFooter?: boolean;
}) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn('space-y-3 rounded-md border bg-card p-4', className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-[120px]" />
        <Skeleton className="h-6 w-[60px]" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
      {showFooter && (
        <div className="border-t pt-4">
          <Skeleton className="h-8 w-full" />
        </div>
      )}
    </div>
  );
}

export { Skeleton, CardSkeleton };

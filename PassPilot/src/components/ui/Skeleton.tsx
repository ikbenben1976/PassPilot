import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'card';
}

export function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-200 rounded-lg',
        variant === 'line' && 'h-4 w-full',
        variant === 'circle' && 'h-10 w-10 rounded-full',
        variant === 'card' && 'h-48 w-full rounded-2xl',
        className,
      )}
    />
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

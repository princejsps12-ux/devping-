import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-md bg-surface-hover', className)}
      {...props}
    >
      {/* Shimmer sweep — theme-aware via the --shimmer token. */}
      <span
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, var(--shimmer), transparent)',
        }}
      />
    </div>
  );
}

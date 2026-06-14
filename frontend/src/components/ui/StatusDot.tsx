import { cn } from '@/lib/utils';

export type Status = 'up' | 'down' | 'degraded' | 'idle';

interface StatusDotProps {
  status: Status;
  /** Show the pulsing ring. Defaults to true for live statuses, off for idle. */
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const dotColor: Record<Status, string> = {
  up: 'bg-status-up',
  down: 'bg-status-down',
  degraded: 'bg-status-degraded',
  idle: 'bg-[var(--text-muted)]',
};

const sizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
};

export function StatusDot({ status, pulse, size = 'md', className }: StatusDotProps) {
  const shouldPulse = pulse ?? status !== 'idle';

  return (
    <span className={cn('relative inline-flex', sizes[size], className)}>
      {shouldPulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-pulse-ring',
            dotColor[status]
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full', sizes[size], dotColor[status])} />
    </span>
  );
}

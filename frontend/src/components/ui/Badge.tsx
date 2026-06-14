import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { StatusDot, Status } from './StatusDot';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: Status;
  /** Show the leading status dot. */
  dot?: boolean;
}

const styles: Record<Status, string> = {
  up: 'bg-status-up/10 text-status-up',
  down: 'bg-status-down/10 text-status-down',
  degraded: 'bg-status-degraded/10 text-status-degraded',
  idle: 'bg-surface-hover text-secondary',
};

const defaultLabel: Record<Status, string> = {
  up: 'Up',
  down: 'Down',
  degraded: 'Degraded',
  idle: 'Idle',
};

export function Badge({ status = 'idle', dot = true, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
        className
      )}
      {...props}
    >
      {dot && <StatusDot status={status} size="sm" pulse={status !== 'idle'} />}
      {children ?? defaultLabel[status]}
    </span>
  );
}

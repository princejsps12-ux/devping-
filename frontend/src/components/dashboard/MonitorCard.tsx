'use client';

import Link from 'next/link';
import { Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { Badge, Card, StatusDot } from '@/components/ui';
import { Status } from '@/components/ui/StatusDot';
import { Monitor } from '@/lib/types';
import { formatInterval, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MonitorCardProps {
  monitor: Monitor;
  onEdit: (monitor: Monitor) => void;
  onDelete: (monitor: Monitor) => void;
  onToggle: (monitor: Monitor) => void;
  isToggling?: boolean;
}

// Map API state to a dot/badge status. A paused monitor reads as idle.
function resolveStatus(monitor: Monitor): { dot: Status; label: string } {
  if (!monitor.isActive) return { dot: 'idle', label: 'Paused' };
  if (monitor.status === 'up') return { dot: 'up', label: 'Up' };
  if (monitor.status === 'down') return { dot: 'down', label: 'Down' };
  return { dot: 'idle', label: 'Unknown' };
}

function IconButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors duration-150',
        'hover:bg-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
}

export function MonitorCard({ monitor, onEdit, onDelete, onToggle, isToggling }: MonitorCardProps) {
  const { dot, label } = resolveStatus(monitor);

  return (
    <Card interactive className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <StatusDot status={dot} pulse={dot === 'up' || dot === 'down'} />
          <Link
            href={`/dashboard/monitors/${monitor.id}`}
            className="truncate text-sm font-medium text-primary transition-colors hover:text-accent"
          >
            {monitor.name}
          </Link>
        </div>
        <Badge status={dot}>{label}</Badge>
      </div>

      <a
        href={monitor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 truncate font-mono text-xs text-muted transition-colors hover:text-secondary"
      >
        {monitor.url}
      </a>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-muted">Interval</p>
            <p className="mt-0.5 font-mono text-sm text-primary">{formatInterval(monitor.interval)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Last check</p>
            <p className="mt-0.5 font-mono text-sm text-primary">
              {formatRelativeTime(monitor.lastCheckedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <IconButton
            label={monitor.isActive ? 'Pause monitor' : 'Resume monitor'}
            onClick={() => onToggle(monitor)}
            disabled={isToggling}
          >
            {monitor.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </IconButton>
          <IconButton label="Edit monitor" onClick={() => onEdit(monitor)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Delete monitor"
            onClick={() => onDelete(monitor)}
            className="hover:bg-status-down/10 hover:text-status-down"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}

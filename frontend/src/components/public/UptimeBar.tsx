'use client';

import { PublicCheck } from '@/lib/types';
import { cn } from '@/lib/utils';

const TOTAL = 30;

const segmentColor: Record<string, string> = {
  up: 'bg-status-up',
  down: 'bg-status-down',
  unknown: 'bg-surface-hover',
};

/** Last 30 checks as colored segments (left = oldest, right = newest). */
export function UptimeBar({ checks }: { checks: PublicCheck[] }) {
  const recent = checks.slice(-TOTAL);
  const padding = Math.max(0, TOTAL - recent.length);

  return (
    <div className="flex w-full items-center gap-[2px]">
      {/* Pad missing history with neutral segments so the bar stays full width. */}
      {Array.from({ length: padding }).map((_, i) => (
        <span key={`pad-${i}`} className="h-8 flex-1 rounded-[2px] bg-surface-hover opacity-50" title="No data" />
      ))}
      {recent.map((c, i) => (
        <span
          key={i}
          title={`${c.status.toUpperCase()} · ${new Date(c.checkedAt).toLocaleString()}`}
          className={cn('h-8 flex-1 rounded-[2px] transition-opacity hover:opacity-80', segmentColor[c.status] ?? 'bg-surface-hover')}
        />
      ))}
    </div>
  );
}

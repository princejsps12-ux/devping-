'use client';

import { Badge } from '@/components/ui';
import { Incident } from '@/lib/types';
import { formatDateTime, formatDuration } from '@/lib/utils';

export function IncidentTable({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center text-sm text-muted">
        No incidents recorded — this monitor has been healthy. 🎉
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs text-muted">
            <th className="px-4 py-2.5 font-medium">Started</th>
            <th className="px-4 py-2.5 font-medium">Resolved</th>
            <th className="px-4 py-2.5 font-medium">Duration</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => {
            const ongoing = inc.resolvedAt === null;
            const end = ongoing ? Date.now() : new Date(inc.resolvedAt!).getTime();
            const duration = end - new Date(inc.startedAt).getTime();
            return (
              <tr
                key={inc.id}
                className="border-b border-[var(--border)] transition-colors last:border-0 hover:bg-surface-hover"
              >
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-secondary">
                  {formatDateTime(inc.startedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-secondary">
                  {ongoing ? '—' : formatDateTime(inc.resolvedAt!)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-primary">
                  {formatDuration(duration)}
                </td>
                <td className="px-4 py-3">
                  {ongoing ? (
                    <Badge status="down">Ongoing</Badge>
                  ) : (
                    <Badge status="up">Resolved</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Badge, Card, Skeleton, StatusDot } from '@/components/ui';
import { Status } from '@/components/ui/StatusDot';
import { ResponseTimeChart } from '@/components/dashboard/ResponseTimeChart';
import { IncidentTable } from '@/components/dashboard/IncidentTable';
import { EmbedCard } from '@/components/dashboard/EmbedCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import {
  useMonitor,
  useMonitorIncidents,
  useMonitorPings,
  useMonitorStats,
} from '@/hooks/useMonitors';
import { MonitorStats, RangeKey } from '@/lib/types';
import { cn, formatRelativeTime } from '@/lib/utils';

const RANGES: RangeKey[] = ['24h', '7d', '30d'];
const RANGE_LABELS: Record<RangeKey, string> = { '24h': '24 hours', '7d': '7 days', '30d': '30 days' };

function statusMeta(stats: MonitorStats | undefined): { dot: Status; label: string } {
  if (!stats) return { dot: 'idle', label: 'Loading' };
  if (!stats.isActive) return { dot: 'idle', label: 'Paused' };
  if (stats.status === 'up') return { dot: 'up', label: 'Operational' };
  if (stats.status === 'down') return { dot: 'down', label: 'Down' };
  return { dot: 'idle', label: 'Unknown' };
}

/** >99% green, >95% yellow, otherwise red. */
function uptimeColor(value: number | null): string {
  if (value === null) return 'text-muted';
  if (value > 99) return 'text-status-up';
  if (value > 95) return 'text-status-degraded';
  return 'text-status-down';
}

function UptimeCard({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">Uptime · {label}</p>
      <p className={cn('mt-1.5 font-mono text-2xl font-medium', uptimeColor(value))}>
        {value !== null ? `${value.toFixed(2)}%` : '—'}
      </p>
    </Card>
  );
}

export default function MonitorDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [range, setRange] = useState<RangeKey>('24h');

  const monitorQuery = useMonitor(id);
  const statsQuery = useMonitorStats(id);
  const pingsQuery = useMonitorPings(id, range);
  const incidentsQuery = useMonitorIncidents(id);

  const monitor = monitorQuery.data;
  const stats = statsQuery.data;
  const meta = statusMeta(stats);

  if (monitorQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-secondary">This monitor couldn&apos;t be found.</p>
        <Link href="/dashboard" className="text-sm font-medium text-accent hover:underline">
          ← Back to monitors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Monitors
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {monitor ? (
            <div className="flex items-center gap-3">
              <StatusDot status={meta.dot} size="md" pulse={meta.dot === 'up' || meta.dot === 'down'} />
              <h1 className="truncate text-2xl font-medium tracking-tight text-primary">
                {monitor.name}
              </h1>
            </div>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          {monitor ? (
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-xs text-muted transition-colors hover:text-secondary"
            >
              {monitor.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Skeleton className="mt-2 h-4 w-64" />
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Badge status={meta.dot}>{meta.label}</Badge>
          {stats && (
            <p className="font-mono text-xs text-muted">
              Checked {formatRelativeTime(stats.lastCheckedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[88px] rounded-xl" />)
        ) : (
          <>
            <UptimeCard label="24h" value={stats?.uptime['24h'] ?? null} />
            <UptimeCard label="7d" value={stats?.uptime['7d'] ?? null} />
            <UptimeCard label="30d" value={stats?.uptime['30d'] ?? null} />
            <Card className="p-4">
              <p className="text-xs text-muted">Avg response · 24h</p>
              <p className="mt-1.5 font-mono text-2xl font-medium text-primary">
                {stats?.avgResponseTime !== null && stats?.avgResponseTime !== undefined
                  ? `${stats.avgResponseTime}ms`
                  : '—'}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* AI Health Insight — standout feature */}
      {monitor && <AIInsightCard monitor={monitor} />}

      {/* Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-tight text-primary">Response time</h2>
          <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  range === r ? 'bg-surface-hover text-primary' : 'text-muted hover:text-secondary'
                )}
                title={RANGE_LABELS[r]}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {pingsQuery.isLoading ? (
          <Skeleton className="h-[280px] rounded-lg" />
        ) : (
          <ResponseTimeChart
            pings={pingsQuery.data ?? []}
            incidents={incidentsQuery.data ?? []}
            range={range}
          />
        )}
      </Card>

      {/* Share & embed */}
      {monitor && <EmbedCard monitor={monitor} />}

      {/* Incidents */}
      <Card className="overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-medium tracking-tight text-primary">Incident history</h2>
        </div>
        {incidentsQuery.isLoading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <IncidentTable incidents={incidentsQuery.data ?? []} />
        )}
      </Card>
    </div>
  );
}

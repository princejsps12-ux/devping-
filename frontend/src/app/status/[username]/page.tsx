'use client';

import Link from 'next/link';
import { CheckCircle2, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { Skeleton, StatusDot } from '@/components/ui';
import { Status } from '@/components/ui/StatusDot';
import { UptimeBar } from '@/components/public/UptimeBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { usePublicStatus } from '@/hooks/usePublicStatus';
import { PublicMonitor } from '@/lib/types';
import { cn } from '@/lib/utils';

type Overall = 'operational' | 'partial' | 'major' | 'empty';

function overallStatus(monitors: PublicMonitor[]): Overall {
  if (monitors.length === 0) return 'empty';
  const down = monitors.filter((m) => m.status === 'down').length;
  if (down === 0) return 'operational';
  if (down === monitors.length) return 'major';
  return 'partial';
}

const banner: Record<Overall, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  operational: { label: 'All Systems Operational', cls: 'border-status-up/30 bg-status-up/10 text-status-up', icon: CheckCircle2 },
  partial: { label: 'Partial Outage', cls: 'border-status-degraded/30 bg-status-degraded/10 text-status-degraded', icon: AlertTriangle },
  major: { label: 'Major Outage', cls: 'border-status-down/30 bg-status-down/10 text-status-down', icon: XCircle },
  empty: { label: 'No monitors yet', cls: 'border-[var(--border)] bg-surface text-secondary', icon: Activity },
};

function dotStatus(s: PublicMonitor['status']): Status {
  return s === 'up' ? 'up' : s === 'down' ? 'down' : 'idle';
}

function monitorLabel(s: PublicMonitor['status']) {
  if (s === 'up') return { text: 'Operational', cls: 'text-status-up' };
  if (s === 'down') return { text: 'Down', cls: 'text-status-down' };
  return { text: 'Unknown', cls: 'text-muted' };
}

function uptimeColor(value: number | null): string {
  if (value === null) return 'text-muted';
  if (value > 99) return 'text-status-up';
  if (value > 95) return 'text-status-degraded';
  return 'text-status-down';
}

export default function PublicStatusPage({ params }: { params: { username: string } }) {
  const { data, isLoading, isError } = usePublicStatus(params.username);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-primary">
              {data?.user.name ?? params.username}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <XCircle className="h-8 w-8 text-muted" />
            <p className="text-sm text-secondary">This status page doesn&apos;t exist.</p>
            <Link href="/" className="text-sm font-medium text-accent hover:underline">
              Go to DevPing →
            </Link>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : (
          data && (
            <>
              <h1 className="mb-1 text-sm font-medium text-muted">Status</h1>
              {(() => {
                const overall = overallStatus(data.monitors);
                const b = banner[overall];
                const Icon = b.icon;
                return (
                  <div className={cn('flex items-center gap-3 rounded-xl border px-5 py-4', b.cls)}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-base font-medium">{b.label}</span>
                  </div>
                );
              })()}

              <div className="mt-6 space-y-3">
                {data.monitors.map((m) => {
                  const label = monitorLabel(m.status);
                  return (
                    <div key={m.id} className="rounded-xl border border-[var(--border)] bg-surface p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <StatusDot status={dotStatus(m.status)} pulse={m.status !== 'unknown'} />
                          <span className="truncate text-sm font-medium text-primary">{m.name}</span>
                        </div>
                        <span className={cn('text-sm font-medium', label.cls)}>{label.text}</span>
                      </div>

                      <div className="mt-3">
                        <UptimeBar checks={m.recentChecks} />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-muted">
                        <span>Last 30 checks</span>
                        <span>
                          <span className={cn('font-mono font-medium', uptimeColor(m.uptime7d))}>
                            {m.uptime7d !== null ? `${m.uptime7d.toFixed(2)}%` : '—'}
                          </span>{' '}
                          uptime · 7d
                        </span>
                      </div>
                    </div>
                  );
                })}

                {data.monitors.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-surface py-16 text-center">
                    <Activity className="h-6 w-6 text-muted" />
                    <p className="text-sm text-secondary">No public monitors to display.</p>
                  </div>
                )}
              </div>
            </>
          )
        )}

        <footer className="mt-10 text-center">
          <Link href="/" className="text-xs text-muted transition-colors hover:text-secondary">
            Powered by ● DevPing
          </Link>
        </footer>
      </main>
    </div>
  );
}

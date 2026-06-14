'use client';

import { AlertTriangle, RefreshCw, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAnalyzeMonitor } from '@/hooks/useMonitors';
import { Monitor, Risk } from '@/lib/types';
import { cn, formatRelativeTime } from '@/lib/utils';

const riskMeta: Record<Risk, { label: string; text: string; box: string; Icon: typeof ShieldCheck }> = {
  low: {
    label: 'Low risk',
    text: 'text-status-up',
    box: 'border-status-up/20 bg-status-up/10',
    Icon: ShieldCheck,
  },
  medium: {
    label: 'Medium risk',
    text: 'text-status-degraded',
    box: 'border-status-degraded/20 bg-status-degraded/10',
    Icon: AlertTriangle,
  },
  high: {
    label: 'High risk',
    text: 'text-status-down',
    box: 'border-status-down/20 bg-status-down/10',
    Icon: Zap,
  },
};

export function AIInsightCard({ monitor }: { monitor: Monitor }) {
  const analyze = useAnalyzeMonitor(monitor.id);
  const risk = monitor.aiRisk;
  const meta = risk ? riskMeta[risk] : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/[0.07] via-surface to-surface p-5">
      {/* Decorative glow to make this the standout card. */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-medium tracking-tight text-primary">AI Health Insight</h2>
            <p className="text-xs text-muted">Predicts downtime risk from recent trends</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          isLoading={analyze.isPending}
          onClick={() => analyze.mutate()}
        >
          {!analyze.isPending && <RefreshCw className="h-3.5 w-3.5" />}
          Analyze now
        </Button>
      </div>

      {meta ? (
        <div className="relative mt-4">
          <div className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-1.5', meta.box)}>
            <meta.Icon className={cn('h-4 w-4', meta.text)} />
            <span className={cn('text-sm font-semibold', meta.text)}>{meta.label}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-secondary">{monitor.aiReason}</p>
          {monitor.aiCheckedAt && (
            <p className="mt-3 font-mono text-xs text-muted">
              Analyzed {formatRelativeTime(monitor.aiCheckedAt)}
            </p>
          )}
        </div>
      ) : (
        <p className="relative mt-4 text-sm text-secondary">
          No analysis yet. Hit <span className="font-medium text-primary">Analyze now</span> to assess
          downtime risk from the latest response-time trends.
        </p>
      )}
    </div>
  );
}

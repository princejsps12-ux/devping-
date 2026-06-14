'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Incident, PingPoint, RangeKey } from '@/lib/types';

const ACCENT = '#00DC82';
const DOWN = '#FF4D4D';

// Recharts sets colors as SVG attributes (no CSS var() support), so read the
// resolved token values from the DOM and refresh them when the theme flips.
function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({ grid: 'rgba(255,255,255,0.08)', text: '#6b6b6b' });

  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    setColors({
      grid: s.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.08)',
      text: s.getPropertyValue('--text-muted').trim() || '#6b6b6b',
    });
  }, [resolvedTheme]);

  return colors;
}

function formatTick(range: RangeKey) {
  return (t: number) => {
    const d = new Date(t);
    if (range === '24h') {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { t: number; ms: number | null } }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-surface px-3 py-2 shadow-lg">
      <p className="font-mono text-xs text-muted">{new Date(point.t).toLocaleString()}</p>
      <p className="mt-0.5 font-mono text-sm text-primary">
        {point.ms !== null ? `${point.ms} ms` : 'No response'}
      </p>
    </div>
  );
}

interface ResponseTimeChartProps {
  pings: PingPoint[];
  incidents: Incident[];
  range: RangeKey;
}

export function ResponseTimeChart({ pings, incidents, range }: ResponseTimeChartProps) {
  const colors = useChartColors();

  const data = pings.map((p) => ({
    t: new Date(p.checkedAt).getTime(),
    ms: p.responseTime,
    status: p.status,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted">
        No response data yet — waiting for the first checks.
      </div>
    );
  }

  const domainStart = data[0].t;
  const domainEnd = data[data.length - 1].t;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rt-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.25} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />

        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={[domainStart, domainEnd]}
          tickFormatter={formatTick(range)}
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={40}
        />
        <YAxis
          stroke={colors.text}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => `${v}ms`}
        />
        <Tooltip content={<ChartTooltip />} />

        {/* Shade downtime windows from incident records. */}
        {incidents.map((inc) => {
          const x1 = new Date(inc.startedAt).getTime();
          const x2 = inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : domainEnd;
          if (x2 < domainStart || x1 > domainEnd) return null;
          return (
            <ReferenceArea
              key={inc.id}
              x1={Math.max(x1, domainStart)}
              x2={Math.min(x2, domainEnd)}
              fill={DOWN}
              fillOpacity={0.1}
              strokeOpacity={0}
            />
          );
        })}

        <Area
          type="monotone"
          dataKey="ms"
          stroke={ACCENT}
          strokeWidth={2}
          fill="url(#rt-fill)"
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

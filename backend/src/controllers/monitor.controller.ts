import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { createMonitorSchema, updateMonitorSchema } from '../utils/validation';
import { AiNotConfiguredError, analyzeMonitor } from '../services/anomaly';

// A monitor row plus its single most-recent ping (if any).
type MonitorWithLatestPing = Prisma.MonitorGetPayload<{
  include: { pings: true };
}>;

const includeLatestPing = {
  pings: {
    orderBy: { checkedAt: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.MonitorInclude;

/**
 * Flatten the latest ping into a derived `status` so the client can render a
 * status dot without a second request. Status is `unknown` until the monitor
 * has been checked at least once.
 */
function serialize(monitor: MonitorWithLatestPing) {
  const { pings, ...rest } = monitor;
  const latest = pings[0];
  return {
    ...rest,
    status: latest ? latest.status.toLowerCase() : 'unknown',
    responseTime: latest?.responseTime ?? null,
    lastCheckedAt: latest?.checkedAt ?? null,
  };
}

export async function createMonitor(req: Request, res: Response): Promise<void> {
  const parsed = createMonitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { name, url, interval } = parsed.data;

  const monitor = await prisma.monitor.create({
    data: {
      name,
      url,
      interval: interval ?? 60,
      userId: req.user!.userId,
    },
    include: includeLatestPing,
  });

  res.status(201).json({ monitor: serialize(monitor) });
}

export async function listMonitors(req: Request, res: Response): Promise<void> {
  const monitors = await prisma.monitor.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: includeLatestPing,
  });

  res.status(200).json({ monitors: monitors.map(serialize) });
}

export async function getMonitor(req: Request, res: Response): Promise<void> {
  // Scope by userId so one user can never read another's monitor.
  const monitor = await prisma.monitor.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: includeLatestPing,
  });

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  res.status(200).json({ monitor: serialize(monitor) });
}

export async function updateMonitor(req: Request, res: Response): Promise<void> {
  const parsed = updateMonitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  // Ownership check before mutating.
  const existing = await prisma.monitor.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  const monitor = await prisma.monitor.update({
    where: { id: existing.id },
    data: parsed.data,
    include: includeLatestPing,
  });

  res.status(200).json({ monitor: serialize(monitor) });
}

export async function deleteMonitor(req: Request, res: Response): Promise<void> {
  // Ownership check; related pings/incidents cascade via the Prisma schema.
  const existing = await prisma.monitor.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  await prisma.monitor.delete({ where: { id: existing.id } });

  res.status(204).send();
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

const RANGES: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

/** Verify the monitor exists and belongs to the requester. */
async function findOwnedMonitor(id: string, userId: string) {
  return prisma.monitor.findFirst({ where: { id, userId } });
}

/** Uptime % over a window: UP pings / total pings. Null when no data. */
async function uptimeSince(monitorId: string, windowMs: number): Promise<number | null> {
  const since = new Date(Date.now() - windowMs);
  const grouped = await prisma.ping.groupBy({
    by: ['status'],
    where: { monitorId, checkedAt: { gte: since } },
    _count: { _all: true },
  });

  let up = 0;
  let total = 0;
  for (const row of grouped) {
    total += row._count._all;
    if (row.status === 'UP') up += row._count._all;
  }
  if (total === 0) return null;
  return Math.round((up / total) * 10000) / 100; // two decimals
}

export async function getMonitorStats(req: Request, res: Response): Promise<void> {
  const monitor = await findOwnedMonitor(req.params.id, req.user!.userId);
  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  const since24h = new Date(Date.now() - RANGES['24h']);

  const [latest, uptime24h, uptime7d, uptime30d, avgAgg] = await Promise.all([
    prisma.ping.findFirst({ where: { monitorId: monitor.id }, orderBy: { checkedAt: 'desc' } }),
    uptimeSince(monitor.id, RANGES['24h']),
    uptimeSince(monitor.id, RANGES['7d']),
    uptimeSince(monitor.id, RANGES['30d']),
    // Average healthy latency over the last 24h (Prisma _avg ignores nulls).
    prisma.ping.aggregate({
      _avg: { responseTime: true },
      where: { monitorId: monitor.id, status: 'UP', checkedAt: { gte: since24h } },
    }),
  ]);

  res.status(200).json({
    stats: {
      status: latest ? latest.status.toLowerCase() : 'unknown',
      isActive: monitor.isActive,
      lastCheckedAt: latest?.checkedAt ?? null,
      lastResponseTime: latest?.responseTime ?? null,
      avgResponseTime:
        avgAgg._avg.responseTime !== null ? Math.round(avgAgg._avg.responseTime) : null,
      uptime: { '24h': uptime24h, '7d': uptime7d, '30d': uptime30d },
    },
  });
}

/** Evenly downsample to a target size while always keeping DOWN points. */
function downsample<T extends { status: string }>(points: T[], target: number): T[] {
  if (points.length <= target) return points;
  const step = Math.ceil(points.length / target);
  return points.filter((p, i) => i % step === 0 || p.status === 'DOWN');
}

export async function getMonitorPings(req: Request, res: Response): Promise<void> {
  const monitor = await findOwnedMonitor(req.params.id, req.user!.userId);
  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  const rangeKey = typeof req.query.range === 'string' && req.query.range in RANGES
    ? req.query.range
    : '24h';
  const since = new Date(Date.now() - RANGES[rangeKey]);

  const pings = await prisma.ping.findMany({
    where: { monitorId: monitor.id, checkedAt: { gte: since } },
    orderBy: { checkedAt: 'asc' },
    select: { checkedAt: true, responseTime: true, status: true },
    take: 5000, // hard cap before downsampling
  });

  const data = downsample(pings, 300).map((p) => ({
    checkedAt: p.checkedAt,
    responseTime: p.responseTime,
    status: p.status.toLowerCase(),
  }));

  res.status(200).json({ range: rangeKey, pings: data });
}

export async function getMonitorIncidents(req: Request, res: Response): Promise<void> {
  const monitor = await findOwnedMonitor(req.params.id, req.user!.userId);
  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  const incidents = await prisma.incident.findMany({
    where: { monitorId: monitor.id },
    orderBy: { startedAt: 'desc' },
    select: { id: true, startedAt: true, resolvedAt: true },
  });

  res.status(200).json({ incidents });
}

export async function getMonitorAnomaly(req: Request, res: Response): Promise<void> {
  const monitor = await prisma.monitor.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    select: { id: true },
  });

  if (!monitor) {
    res.status(404).json({ error: 'Monitor not found' });
    return;
  }

  try {
    const result = await analyzeMonitor(monitor.id);
    res.status(200).json({ anomaly: result });
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      res.status(503).json({ error: error.message });
      return;
    }
    console.error('[anomaly] analysis failed:', error);
    res.status(502).json({ error: 'AI analysis failed. Please try again.' });
  }
}

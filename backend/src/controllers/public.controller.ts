import { Request, Response } from 'express';
import { prisma } from '../config/db';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_CHECKS = 30;

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
  return Math.round((up / total) * 10000) / 100;
}

/**
 * Public status for a user's shared page. No auth. Returns only monitors the
 * owner has marked public.
 */
export async function getPublicStatus(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username },
    select: { username: true, name: true },
  });

  if (!user) {
    res.status(404).json({ error: 'Status page not found' });
    return;
  }

  const monitors = await prisma.monitor.findMany({
    where: { user: { username: req.params.username }, isPublic: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });

  const data = await Promise.all(
    monitors.map(async (monitor) => {
      // Latest 30 checks power the current status and the uptime bar.
      const recent = await prisma.ping.findMany({
        where: { monitorId: monitor.id },
        orderBy: { checkedAt: 'desc' },
        take: RECENT_CHECKS,
        select: { status: true, checkedAt: true },
      });

      const uptime7d = await uptimeSince(monitor.id, SEVEN_DAYS_MS);

      return {
        id: monitor.id,
        name: monitor.name,
        status: recent[0] ? recent[0].status.toLowerCase() : 'unknown',
        uptime7d,
        // Oldest → newest so the bar reads left to right.
        recentChecks: recent
          .slice()
          .reverse()
          .map((p) => ({ status: p.status.toLowerCase(), checkedAt: p.checkedAt })),
      };
    })
  );

  res.status(200).json({ user, monitors: data });
}

// ---------------------------------------------------------------------------
// SVG status badge (shields.io style)
// ---------------------------------------------------------------------------

const COLORS = {
  up: '#2ea043',
  down: '#e5484d',
  unknown: '#9ca3af',
} as const;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Build a flat, shields.io-style badge with "status | ● value". */
export function renderBadge(value: 'up' | 'down' | 'unknown'): string {
  const label = 'status';
  const text = `● ${value}`;
  // Generous per-glyph estimate (the ● bullet and 'w' are wide) to avoid the
  // text overflowing the colored pill.
  const labelWidth = Math.round(label.length * 7) + 14;
  const valueWidth = Math.round(text.length * 7.4) + 20;
  const total = labelWidth + valueWidth;
  const labelMid = labelWidth / 2;
  const valueMid = labelWidth + valueWidth / 2;
  // Constrain glyphs to the inner width so text never overflows the pill,
  // regardless of which fallback font the renderer uses.
  const labelInner = labelWidth - 12;
  const valueInner = valueWidth - 14;
  const color = COLORS[value];
  const label2 = escapeXml(label);
  const text2 = escapeXml(text);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="status: ${value}">
  <title>status: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#444d56"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${total}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelMid}" y="15" fill="#010101" fill-opacity=".3" textLength="${labelInner}" lengthAdjust="spacingAndGlyphs">${label2}</text>
    <text x="${labelMid}" y="14" textLength="${labelInner}" lengthAdjust="spacingAndGlyphs">${label2}</text>
    <text x="${valueMid}" y="15" fill="#010101" fill-opacity=".3" textLength="${valueInner}" lengthAdjust="spacingAndGlyphs">${text2}</text>
    <text x="${valueMid}" y="14" textLength="${valueInner}" lengthAdjust="spacingAndGlyphs">${text2}</text>
  </g>
</svg>`;
}

export async function getBadge(req: Request, res: Response): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: req.params.monitorId },
    select: { id: true },
  });

  let value: 'up' | 'down' | 'unknown' = 'unknown';
  if (monitor) {
    const latest = await prisma.ping.findFirst({
      where: { monitorId: monitor.id },
      orderBy: { checkedAt: 'desc' },
      select: { status: true },
    });
    if (latest) value = latest.status === 'UP' ? 'up' : 'down';
  }

  res.setHeader('Content-Type', 'image/svg+xml');
  // Short cache so embedded badges refresh, but proxies don't hammer us.
  res.setHeader('Cache-Control', 'max-age=60, s-maxage=60');
  res.status(200).send(renderBadge(value));
}

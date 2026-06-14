import axios from 'axios';
import { Monitor, PingStatus } from '@prisma/client';
import { prisma } from '../config/db';
import { sendDownAlert, sendRecoveryAlert } from './email';

const REQUEST_TIMEOUT_MS = 10_000;

// Simulated check origins. A monitor is only truly DOWN if it fails from every
// region, which guards against single-region network blips (false positives).
export const REGIONS = ['us-east', 'eu-west'] as const;

// Monitor row plus just the owner's email, for alerting.
export type MonitorWithOwner = Monitor & { user: { email: string } };

interface CheckResult {
  status: PingStatus;
  responseTime: number | null;
}

interface RegionResult {
  status: PingStatus;
  responseTime: number | null;
  /** Comma-separated failing region(s), or null when all regions were healthy. */
  region: string | null;
}

/**
 * Send a single HTTP GET and classify the result.
 * - 2xx/3xx (200–399) → UP, with the measured response time.
 * - non-2xx (4xx/5xx) → DOWN, but it did respond, so keep the response time.
 * - network error / timeout / DNS failure → DOWN with no response time.
 */
export async function performCheck(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      // Resolve for every status code so we classify ranges ourselves
      // instead of axios throwing on 4xx/5xx.
      validateStatus: () => true,
      maxRedirects: 5,
      headers: { 'User-Agent': 'DevPing/1.0 (+https://devping.io)' },
    });
    const responseTime = Date.now() - start;
    const ok = res.status >= 200 && res.status <= 399;
    return { status: ok ? PingStatus.UP : PingStatus.DOWN, responseTime };
  } catch {
    // Timeout, connection refused, DNS error, etc. — no usable response time.
    return { status: PingStatus.DOWN, responseTime: null };
  }
}

/**
 * Check the URL from every simulated region. The monitor is DOWN only if all
 * regions fail; response time is averaged across the regions that succeeded.
 */
export async function checkFromRegions(url: string): Promise<RegionResult> {
  const results = await Promise.all(
    REGIONS.map(async (region) => ({ region, ...(await performCheck(url)) }))
  );

  const failing = results.filter((r) => r.status === PingStatus.DOWN);
  const healthy = results.filter((r) => r.status === PingStatus.UP);

  // Truly DOWN only when every region failed.
  const status = failing.length === REGIONS.length ? PingStatus.DOWN : PingStatus.UP;

  const times = healthy.map((r) => r.responseTime).filter((t): t is number => t !== null);
  const responseTime = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;

  const region = failing.length ? failing.map((r) => r.region).join(',') : null;

  return { status, responseTime, region };
}

/**
 * Check a single monitor across regions, persist the ping, and open/resolve an
 * incident (with email alerts) on a status transition.
 *
 * DB errors propagate so the BullMQ worker can retry; email failures are
 * swallowed so a flaky mail provider never blocks a retry.
 */
export async function checkMonitor(monitor: MonitorWithOwner): Promise<void> {
  // Previous status drives transition detection — read it before saving.
  const previous = await prisma.ping.findFirst({
    where: { monitorId: monitor.id },
    orderBy: { checkedAt: 'desc' },
    select: { status: true },
  });
  const prevStatus = previous?.status;

  const result = await checkFromRegions(monitor.url);

  await prisma.ping.create({
    data: {
      monitorId: monitor.id,
      status: result.status,
      responseTime: result.responseTime,
      region: result.region,
    },
  });

  const icon = result.status === PingStatus.UP ? '✓' : '✗';
  const timing = result.responseTime !== null ? `${result.responseTime}ms` : '—';
  const regionNote = result.region ? ` [failed: ${result.region}]` : '';
  console.log(
    `[worker] ${icon} ${monitor.name} ${result.status} ${timing}${regionNote} (${monitor.url})`
  );

  // UP → DOWN (or first-ever check that's already down): open an incident.
  if (result.status === PingStatus.DOWN && prevStatus !== PingStatus.DOWN) {
    const open = await prisma.incident.findFirst({
      where: { monitorId: monitor.id, resolvedAt: null },
      select: { id: true },
    });
    if (!open) {
      await prisma.incident.create({ data: { monitorId: monitor.id } });
      console.log(`[worker] 🔴 incident OPENED for ${monitor.name}`);
      try {
        await sendDownAlert(monitor.user.email, monitor.name, monitor.url);
      } catch (emailError) {
        console.error(`[worker] failed to send down alert for ${monitor.name}:`, emailError);
      }
    }
  }

  // DOWN → UP: resolve the open incident.
  if (result.status === PingStatus.UP && prevStatus === PingStatus.DOWN) {
    const open = await prisma.incident.findFirst({
      where: { monitorId: monitor.id, resolvedAt: null },
      orderBy: { startedAt: 'desc' },
      select: { id: true, startedAt: true },
    });
    if (open) {
      const resolvedAt = new Date();
      await prisma.incident.update({ where: { id: open.id }, data: { resolvedAt } });
      console.log(`[worker] 🟢 incident RESOLVED for ${monitor.name}`);

      const downtimeMs = resolvedAt.getTime() - open.startedAt.getTime();
      try {
        await sendRecoveryAlert(monitor.user.email, monitor.name, monitor.url, downtimeMs);
      } catch (emailError) {
        console.error(`[worker] failed to send recovery alert for ${monitor.name}:`, emailError);
      }
    }
  }
}

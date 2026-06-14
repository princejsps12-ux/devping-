import { Job, Worker } from 'bullmq';
import { prisma } from '../config/db';
import { createRedisConnection } from './connection';
import { CHECK_JOB_OPTIONS, PING_QUEUE, pingQueue } from './pingQueue';
import { checkMonitor } from '../services/pinger';

async function processor(job: Job): Promise<void> {
  if (job.name === 'dispatch') {
    // Fan out: enqueue a check job per active monitor.
    const monitors = await prisma.monitor.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    if (monitors.length === 0) return;

    await pingQueue.addBulk(
      monitors.map((m) => ({ name: 'check', data: { monitorId: m.id }, opts: CHECK_JOB_OPTIONS }))
    );
    console.log(`[queue] dispatched ${monitors.length} check job(s)`);
    return;
  }

  if (job.name === 'check') {
    const { monitorId } = job.data as { monitorId: string };
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { user: { select: { email: true } } },
    });
    // Monitor may have been deleted or paused between dispatch and processing.
    if (!monitor || !monitor.isActive) return;

    // Throwing here lets BullMQ retry per CHECK_JOB_OPTIONS.
    await checkMonitor(monitor);
  }
}

/** Start the ping worker. Processes both dispatch and check jobs. */
export function createPingWorker(): Worker {
  const worker = new Worker(PING_QUEUE, processor, {
    connection: createRedisConnection(),
    concurrency: 10,
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.name}#${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
  });
  worker.on('error', (err) => console.error('[worker] error:', err.message));

  console.log('[queue] ping worker started (concurrency 10, 2 retries per check)');
  return worker;
}

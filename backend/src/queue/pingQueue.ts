import { JobsOptions, Queue } from 'bullmq';
import { createRedisConnection } from './connection';

export const PING_QUEUE = 'ping';

// One queue carries two job types:
//   - "dispatch": fan-out trigger that enqueues a check per active monitor.
//   - "check":    a single monitor's multi-region health check.
export const pingQueue = new Queue(PING_QUEUE, { connection: createRedisConnection() });

const DISPATCH_INTERVAL_MS = 60_000;

// Per-check retry policy: 1 initial attempt + 2 retries with exponential backoff.
export const CHECK_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 200,
  removeOnFail: 100,
};

/**
 * Arm the repeatable "dispatch" job. Idempotent — BullMQ dedupes repeatable
 * jobs by their repeat options, so calling this on every boot is safe.
 */
export async function setupPingScheduler(): Promise<void> {
  await pingQueue.add(
    'dispatch',
    {},
    { repeat: { every: DISPATCH_INTERVAL_MS }, removeOnComplete: true, removeOnFail: true }
  );
  console.log(`[queue] ping scheduler armed — dispatching every ${DISPATCH_INTERVAL_MS / 1000}s`);
}

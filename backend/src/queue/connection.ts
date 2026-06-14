import IORedis from 'ioredis';
import { env } from '../config/env';

/**
 * Create a Redis connection for BullMQ. BullMQ requires
 * `maxRetriesPerRequest: null`. Each Queue/Worker should get its own
 * connection (Workers use blocking commands).
 */
export function createRedisConnection(): IORedis {
  const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });
  connection.on('error', (err) => {
    // Log without crashing — the HTTP API keeps serving even if Redis is down.
    console.error('[redis] connection error:', err.message);
  });
  return connection;
}

// Standalone worker entrypoint — run this as a separate process (e.g. a Render
// background worker) to scale ping processing horizontally. Safe to run
// alongside the API: the scheduler is idempotent and BullMQ distributes jobs.
import { createPingWorker, setupPingScheduler } from './queue';
import { startAnomalyCron } from './services/anomaly';

createPingWorker();
setupPingScheduler().catch((err) => console.error('[queue] failed to arm scheduler:', err));
startAnomalyCron();

console.log('[worker] standalone DevPing worker started');

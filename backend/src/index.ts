import express, { NextFunction, Request, Response } from 'express';
// Patches Express so rejections from async route handlers reach the error
// middleware instead of crashing the process. Must be imported before routes.
import 'express-async-errors';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { createPingWorker, setupPingScheduler } from './queue';
import { startAnomalyCron } from './services/anomaly';

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.use('/api', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`DevPing API listening on http://localhost:${env.port}`);

  // Arm the BullMQ ping scheduler. Set RUN_WORKER=false to offload processing
  // to a dedicated worker process (see src/worker.ts) for horizontal scaling.
  setupPingScheduler().catch((err) => console.error('[queue] failed to arm scheduler:', err));
  if (process.env.RUN_WORKER !== 'false') {
    createPingWorker();
  }

  // Optional: periodic AI anomaly analysis (no-op without GROQ_API_KEY).
  startAnomalyCron();
});

import { Router } from 'express';
import {
  createMonitor,
  deleteMonitor,
  getMonitor,
  getMonitorAnomaly,
  getMonitorIncidents,
  getMonitorPings,
  getMonitorStats,
  listMonitors,
  updateMonitor,
} from '../controllers/monitor.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Every monitor route requires a valid JWT.
router.use(requireAuth);

router.post('/', createMonitor);
router.get('/', listMonitors);
router.get('/:id', getMonitor);
router.patch('/:id', updateMonitor);
router.delete('/:id', deleteMonitor);

// Analytics
router.get('/:id/stats', getMonitorStats);
router.get('/:id/pings', getMonitorPings);
router.get('/:id/incidents', getMonitorIncidents);
router.get('/:id/anomaly', getMonitorAnomaly);

export default router;

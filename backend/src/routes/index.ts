import { Router } from 'express';
import authRoutes from './auth.routes';
import monitorRoutes from './monitor.routes';
import { getBadge, getPublicStatus } from '../controllers/public.controller';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/monitors', monitorRoutes);

// Public, unauthenticated endpoints.
router.get('/public/status/:username', getPublicStatus);
router.get('/badge/:monitorId', getBadge);

export default router;

import { Router } from 'express';
import { LifecycleController } from './lifecycle.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/clock', LifecycleController.getClockState);
router.post('/clock', requireRole('SYSTEM_ADMIN', 'SCRUTINY_OFFICER'), LifecycleController.shiftClock);
router.post('/clock/reset', requireRole('SYSTEM_ADMIN', 'SCRUTINY_OFFICER'), LifecycleController.resetClock);
router.post('/scan-now', requireRole('SYSTEM_ADMIN', 'SCRUTINY_OFFICER'), LifecycleController.runScanNow);
router.get('/rules', LifecycleController.getRules);

export default router;

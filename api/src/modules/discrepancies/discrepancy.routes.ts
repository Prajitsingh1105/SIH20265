import { Router } from 'express';
import { DiscrepancyController } from './discrepancy.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', DiscrepancyController.getFlags);
router.post('/:id/resolve', requireRole('SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'), DiscrepancyController.resolveFlag);

export default router;

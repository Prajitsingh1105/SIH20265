import { Router } from 'express';
import { FdrController } from './fdr.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', FdrController.getFdrs);
router.get('/:id', FdrController.getFdrById);
router.post('/', requireRole('INSTITUTION', 'SYSTEM_ADMIN'), FdrController.createFdr);
router.post('/:id/resubmit', requireRole('INSTITUTION', 'SYSTEM_ADMIN'), FdrController.resubmitFdr);
router.post('/:id/renew', requireRole('INSTITUTION', 'SYSTEM_ADMIN'), FdrController.renewFdr);
router.post('/:id/scrutiny-note', requireRole('SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'), FdrController.addScrutinyNote);

export default router;

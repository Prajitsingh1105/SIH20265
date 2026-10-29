import { Router } from 'express';
import { VerificationController } from './verification.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/verify', requireRole('SCRUTINY_OFFICER', 'SYSTEM_ADMIN'), VerificationController.verifyFdr);
router.get('/comparison/:fdrId', VerificationController.getComparison);

export default router;

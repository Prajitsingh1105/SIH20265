import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Only Officers, Competent Authorities & Admins can access audit logs
router.use(authenticate, requireRole('SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'));

router.get('/', AuditController.getLogs);
router.get('/verify-chain', AuditController.verifyChain);
router.post('/simulate-tamper', AuditController.simulateTamper);
router.post('/repair', AuditController.repairChain);

export default router;

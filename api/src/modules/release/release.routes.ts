import { Router } from 'express';
import { ReleaseController } from './release.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Publicly verifiable release order endpoint (for QR code scan!)
router.get('/order/:orderNumber/download', ReleaseController.downloadOrder);

router.use(authenticate);

router.get('/requests', ReleaseController.getRequests);
router.get('/requests/:id', ReleaseController.getRequestById);
router.get('/eligibility/:fdrId', ReleaseController.checkEligibility);
router.post('/requests', requireRole('INSTITUTION', 'SYSTEM_ADMIN'), ReleaseController.createRequest);
router.post('/requests/:id/scrutinize', requireRole('SCRUTINY_OFFICER', 'SYSTEM_ADMIN'), ReleaseController.scrutinize);
router.post('/requests/:id/decision', requireRole('COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'), ReleaseController.authorityDecision);

export default router;

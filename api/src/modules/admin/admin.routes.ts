import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Publicly readable lists for forms and dropdowns
router.get('/institutions', AdminController.getInstitutions);
router.get('/banks', AdminController.getBanks);

// Admin-only endpoints
router.post('/reset-demo-data', requireRole('SYSTEM_ADMIN'), AdminController.resetDemoData);
router.get('/users', requireRole('SYSTEM_ADMIN'), AdminController.getUsers);

export default router;

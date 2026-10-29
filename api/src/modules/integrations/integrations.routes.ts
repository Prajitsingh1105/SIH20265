import { Router } from 'express';
import { IntegrationsController } from './integrations.controller';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireRole('SYSTEM_ADMIN', 'SCRUTINY_OFFICER'));

router.get('/', IntegrationsController.getIntegrations);
router.post('/:id/test', IntegrationsController.testConnection);

export default router;

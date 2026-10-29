import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard', ReportsController.getDashboardStats);
router.get('/export/csv', ReportsController.exportCsv);

export default router;

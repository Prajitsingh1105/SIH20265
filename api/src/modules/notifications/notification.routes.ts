import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', NotificationController.getNotifications);
router.post('/read-all', NotificationController.markAllAsRead);
router.post('/:id/read', NotificationController.markAsRead);
router.get('/sms-outbox', NotificationController.getSmsOutbox);

export default router;

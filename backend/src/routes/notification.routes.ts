import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification.controller';

const router = Router();

router.use(requireAuth);

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.post('/mark-all-read', markAllNotificationsAsRead);

export default router;

import express from 'express';
import {
    getNotifications,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount
} from '../controllers/notificationController.js';
import { authComptable } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authComptable, getNotifications);

router.get('/unread-count', authComptable, getUnreadCount);

router.put('/:id/read', authComptable, markNotificationAsRead);

router.put('/read-all', authComptable, markAllAsRead);

router.delete('/:id', authComptable, deleteNotification);

export default router;
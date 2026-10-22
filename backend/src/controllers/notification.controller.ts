import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const result = await notificationService.getUserNotifications(req.user!.userId, page, limit);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, 'Failed to retrieve notifications', 500);
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await notificationService.markAsRead(req.user!.userId, id);
    if (!success) {
      sendError(res, 'Notification not found or already read', 404);
      return;
    }
    sendSuccess(res, { message: 'Notification marked as read' });
  } catch (error) {
    sendError(res, 'Failed to update notification', 500);
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const count = await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, { markedCount: count, message: 'All notifications marked as read' });
  } catch (error) {
    sendError(res, 'Failed to mark notifications as read', 500);
  }
};

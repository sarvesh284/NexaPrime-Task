import mongoose from 'mongoose';
import { NotificationModel, NotificationType } from '../models/notification.model';
import { Pagination } from '../types';

export class NotificationService {
  /**
   * Create an in-app notification for a user
   */
  async createNotification(
    userId: string | mongoose.Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
  ) {
    try {
      const notification = await NotificationModel.create({
        userId,
        type,
        title,
        message,
        link: link || '',
      });
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Get user's notifications with pagination and unread count
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: any[];
    unreadCount: number;
    pagination: Pagination;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments({ userId: userObjectId }),
      NotificationModel.countDocuments({ userId: userObjectId, isRead: false }),
    ]);

    const formattedNotifications = notifications.map((n: any) => ({
      ...n,
      id: n._id.toString(),
      _id: undefined,
    }));

    return {
      notifications: formattedNotifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const res = await NotificationModel.updateOne(
      { _id: new mongoose.Types.ObjectId(notificationId), userId: new mongoose.Types.ObjectId(userId) },
      { $set: { isRead: true } }
    );
    return res.modifiedCount > 0;
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
    return res.modifiedCount;
  }
}

export const notificationService = new NotificationService();

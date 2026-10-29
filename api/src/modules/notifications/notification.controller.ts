import { Request, Response } from 'express';
import { prisma } from '../../config/db';

export class NotificationController {
  /**
   * Get notifications for current user/institution
   */
  public static async getNotifications(req: Request, res: Response) {
    try {
      const where: any = {};
      if (req.user?.role === 'INSTITUTION') {
        where.institutionId = req.user.institutionId;
      }

      const [unreadCount, notifications] = await Promise.all([
        prisma.notification.count({ where: { ...where, isRead: false } }),
        prisma.notification.findMany({
          where,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return res.json({
        success: true,
        data: {
          unreadCount,
          notifications,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
  }

  /**
   * Mark single notification as read
   */
  public static async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead(req: Request, res: Response) {
    try {
      const where: any = { isRead: false };
      if (req.user?.role === 'INSTITUTION') {
        where.institutionId = req.user.institutionId;
      }
      await prisma.notification.updateMany({
        where,
        data: { isRead: true },
      });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
  }

  /**
   * Get SMS Outbox records for in-app SMS view
   */
  public static async getSmsOutbox(req: Request, res: Response) {
    try {
      const outbox = await prisma.smsOutbox.findMany({
        take: 50,
        orderBy: { sentAt: 'desc' },
      });
      return res.json({ success: true, data: outbox });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to retrieve SMS outbox' });
    }
  }
}

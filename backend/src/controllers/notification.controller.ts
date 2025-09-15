import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types for request bodies
interface CreateNotificationBody {
  type: 'telegram' | 'whatsapp' | 'email';
  channel_config: {
    chatId?: string;
    phone?: string;
    email?: string;
  };
}

interface UpdateNotificationBody {
  is_enabled?: boolean;
  channel_config?: any;
}

interface SendTestNotificationBody {
  type: 'telegram' | 'whatsapp' | 'email';
  message: string;
}

export class NotificationController {
  /**
   * Get user's notifications
   */
  async getUserNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const notifications = await prisma.notification.findMany({
        where: { user_id: userId },
        include: {
          logs: {
            orderBy: { created_at: 'desc' },
            take: 10, // Last 10 logs
          },
        },
      });

      reply.send({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  }

  /**
   * Create or update notification settings
   */
  async upsertNotification(request: FastifyRequest<{ Body: CreateNotificationBody }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { type, channel_config } = request.body;

      // Validate channel config based on type
      if (type === 'telegram' && !channel_config.chatId) {
        return reply.code(400).send({
          success: false,
          error: 'Telegram chat ID is required',
        });
      }

      if (type === 'whatsapp' && !channel_config.phone) {
        return reply.code(400).send({
          success: false,
          error: 'WhatsApp phone number is required',
        });
      }

      if (type === 'email' && !channel_config.email) {
        return reply.code(400).send({
          success: false,
          error: 'Email address is required',
        });
      }

      const notification = await prisma.notification.upsert({
        where: {
          user_id_type: {
            user_id: userId,
            type,
          },
        },
        update: {
          channel_config,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          type,
          channel_config,
        },
      });

      reply.send({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Error upserting notification:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to save notification settings',
      });
    }
  }

  /**
   * Update notification settings
   */
  async updateNotification(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateNotificationBody;
    }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;
      const { is_enabled, channel_config } = request.body;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!notification) {
        return reply.code(404).send({
          success: false,
          error: 'Notification not found',
        });
      }

      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          ...(is_enabled !== undefined && { is_enabled }),
          ...(channel_config && { channel_config }),
          updated_at: new Date(),
        },
      });

      reply.send({
        success: true,
        data: updatedNotification,
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to update notification',
      });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params;

      const notification = await prisma.notification.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!notification) {
        return reply.code(404).send({
          success: false,
          error: 'Notification not found',
        });
      }

      await prisma.notification.delete({
        where: { id },
      });

      reply.send({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to delete notification',
      });
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(request: FastifyRequest<{ Body: SendTestNotificationBody }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { type, message } = request.body;

      // Check if user has this notification type configured
      const notification = await prisma.notification.findFirst({
        where: {
          user_id: userId,
          type,
          is_enabled: true,
        },
      });

      if (!notification) {
        return reply.code(400).send({
          success: false,
          error: `${type} notifications are not configured or enabled`,
        });
      }

      // Import the notification queue
      const { notificationQueue } = await import('../queues/notification.queue');

      // Add test notification to queue
      await notificationQueue.add('test-notification', {
        userId,
        type: 'system_alert',
        channel: type,
        message: `🧪 TESTE: ${message}`,
        metadata: {
          isTest: true,
          testTimestamp: new Date().toISOString(),
        },
      });

      reply.send({
        success: true,
        message: `Test ${type} notification queued successfully`,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to send test notification',
      });
    }
  }

  /**
   * Get notification logs
   */
  async getNotificationLogs(request: FastifyRequest<{ Querystring: { page?: string; limit?: string; channel?: string } }>, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;
      const { page = '1', limit = '20', channel } = request.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const where: any = { user_id: userId };
      if (channel) {
        where.channel = channel;
      }

      const [logs, total] = await Promise.all([
        prisma.notificationLog.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limitNum,
        }),
        prisma.notificationLog.count({ where }),
      ]);

      reply.send({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch notification logs',
      });
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      const [totalSent, totalFailed, recentLogs] = await Promise.all([
        prisma.notificationLog.count({
          where: { user_id: userId, status: 'sent' },
        }),
        prisma.notificationLog.count({
          where: { user_id: userId, status: 'failed' },
        }),
        prisma.notificationLog.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          take: 5,
        }),
      ]);

      const successRate = totalSent + totalFailed > 0
        ? (totalSent / (totalSent + totalFailed)) * 100
        : 0;

      reply.send({
        success: true,
        data: {
          total_sent: totalSent,
          total_failed: totalFailed,
          success_rate: Math.round(successRate * 100) / 100,
          recent_logs: recentLogs,
        },
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to fetch notification statistics',
      });
    }
  }
}

// Export singleton instance
export const notificationController = new NotificationController();


import { FastifyInstance } from 'fastify';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function notificationRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get user's notifications
  fastify.get('/api/notifications', notificationController.getUserNotifications.bind(notificationController));

  // Create or update notification settings
  fastify.post('/api/notifications', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'channel_config'],
        properties: {
          type: { type: 'string', enum: ['telegram', 'whatsapp', 'email'] },
          channel_config: {
            type: 'object',
            properties: {
              chatId: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
            },
          },
        },
      },
    },
  }, notificationController.upsertNotification.bind(notificationController));

  // Update notification settings
  fastify.put('/api/notifications/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          is_enabled: { type: 'boolean' },
          channel_config: { type: 'object' },
        },
      },
    },
  }, notificationController.updateNotification.bind(notificationController));

  // Delete notification
  fastify.delete('/api/notifications/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, notificationController.deleteNotification.bind(notificationController));

  // Send test notification
  fastify.post('/api/notifications/test', {
    schema: {
      body: {
        type: 'object',
        required: ['type', 'message'],
        properties: {
          type: { type: 'string', enum: ['telegram', 'whatsapp', 'email'] },
          message: { type: 'string', minLength: 1, maxLength: 500 },
        },
      },
    },
  }, notificationController.sendTestNotification.bind(notificationController));

  // Get notification logs with pagination
  fastify.get('/api/notifications/logs', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '20' },
          channel: { type: 'string', enum: ['telegram', 'whatsapp', 'email'] },
        },
      },
    },
  }, notificationController.getNotificationLogs.bind(notificationController));

  // Get notification statistics
  fastify.get('/api/notifications/stats', notificationController.getNotificationStats.bind(notificationController));
}


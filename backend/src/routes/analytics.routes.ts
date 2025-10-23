import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AnalyticsService } from '../services/analytics.service';
import { authMiddleware } from '../middleware/auth.middleware';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const analyticsService = new AnalyticsService(prisma, fastify);

  // POST /api/analytics/track - Track analytics event
  fastify.post('/api/analytics/track', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Track analytics event',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['event'],
        properties: {
          event: { type: 'string' },
          properties: { type: 'object' },
          sessionId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { event, properties, sessionId } = request.body as any;
      const userId = request.user.sub;

      await analyticsService.trackEvent({
        event,
        properties,
        userId,
        sessionId
      });

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Error tracking analytics:', error);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to track analytics event'
      });
    }
  });

  // GET /api/analytics/events - Get analytics events
  fastify.get('/api/analytics/events', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get analytics events',
      tags: ['Analytics'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          event: { type: 'string' },
          days: { type: 'number', default: 30 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              event: { type: 'string' },
              properties: { type: 'object' },
              user_id: { type: 'string' },
              session_id: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { event, days } = request.query as any;
      const userId = request.user.sub;

      const events = await analyticsService.getAnalytics(userId, event, days);

      return reply.send(events);
    } catch (error) {
      fastify.log.error('Error getting analytics:', error);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to get analytics events'
      });
    }
  });
}

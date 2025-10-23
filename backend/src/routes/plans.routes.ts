import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PlansService } from '../services/plans.service';
import { authMiddleware } from '../middleware/auth.middleware';

export async function plansRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const plansService = new PlansService(prisma, fastify);

  // Middleware to require verified email
  const requireVerified = async (request: any, reply: any) => {
    const user = request.user;
    if (!user.email_verified) {
      return reply.status(403).send({
        error: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Please verify your email to access plan features'
      });
    }
  };

  // GET /api/plans - Get available plans
  fastify.get('/api/plans', {
    preHandler: [authMiddleware, requireVerified],
    schema: {
      description: 'Get available plans',
      tags: ['Plans'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const plans = await plansService.getAvailablePlans();
      return reply.send(plans);
    } catch (error) {
      fastify.log.error('Error getting plans:', error);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to get plans'
      });
    }
  });

  // POST /api/plans/choose - Choose a plan
  fastify.post('/api/plans/choose', {
    preHandler: [authMiddleware, requireVerified],
    schema: {
      description: 'Choose a plan',
      tags: ['Plans'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['plan'],
        properties: {
          plan: { 
            type: 'string',
            enum: ['FREE', 'BASIC', 'ADVANCED', 'PRO']
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            entitlements: {
              type: 'object',
              properties: {
                plan: { type: 'string' },
                feature_set: { type: 'string' },
                demo_mode: { type: 'boolean' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { plan } = request.body as { plan: string };
      const userId = request.user.sub;

      const result = await plansService.choosePlan(userId, plan);

      if (!result.success) {
        return reply.status(400).send({
          error: 'INVALID_PLAN',
          message: 'Invalid plan selected'
        });
      }

      return reply.send({
        success: true,
        entitlements: result.entitlements
      });
    } catch (error) {
      fastify.log.error('Error choosing plan:', error);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Failed to choose plan'
      });
    }
  });
}
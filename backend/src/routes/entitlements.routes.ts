import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { EntitlementsService } from '../services/entitlements.service';
import { authMiddleware } from '../middleware/auth.middleware';

export async function entitlementsRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const entitlementsService = new EntitlementsService(prisma);
  
  /**
   * GET /api/me/entitlements
   * Obtém entitlements do usuário atual
   */
  fastify.get('/api/me/entitlements', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get current user entitlements',
      tags: ['Entitlements'],
      response: {
        200: {
          type: 'object',
          properties: {
            plan: { type: 'string' },
            feature_set: { type: 'string' },
            demo_mode: { type: 'boolean' },
            features: { 
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.sub;
      const entitlements = await entitlementsService.getUserEntitlements(userId);
      
      if (!entitlements) {
        return reply.status(404).send({ 
          error: 'Entitlements not found' 
        });
      }

      // Obter features disponíveis
      const features = entitlementsService['getFeaturesByPlan'](entitlements.feature_set);
      
      return reply.send({
        plan: entitlements.plan,
        feature_set: entitlements.feature_set,
        demo_mode: entitlements.demo_mode,
        features
      });
    } catch (error: any) {
      fastify.log.error('Error getting entitlements:', error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/me/entitlements/check-feature
   * Verifica se usuário tem uma feature específica
   */
  fastify.post('/api/me/entitlements/check-feature', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Check if user has a specific feature',
      tags: ['Entitlements'],
      body: {
        type: 'object',
        required: ['feature'],
        properties: {
          feature: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            hasFeature: { type: 'boolean' },
            feature: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.sub;
      const { feature } = request.body as { feature: string };
      
      const hasFeature = await entitlementsService.hasFeature(userId, feature);
      
      return reply.send({
        hasFeature,
        feature
      });
    } catch (error: any) {
      fastify.log.error('Error checking feature:', error);
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  });
}

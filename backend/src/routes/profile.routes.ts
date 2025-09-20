import { FastifyInstance } from 'fastify';
import { ProfileController } from '../controllers/profile.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const profileController = new ProfileController(prisma);

export async function profileRoutes(fastify: FastifyInstance) {
  // GET /api/profile - Buscar perfil do usuário
  fastify.get('/profile', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Get user profile',
      tags: ['Profile'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                plan_type: { type: 'string' },
                created_at: { type: 'string' },
                last_activity_at: { type: 'string' },
                ln_markets_api_key: { type: 'string' },
                ln_markets_api_secret: { type: 'string' },
                ln_markets_passphrase: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, profileController.getProfile.bind(profileController));

  // PUT /api/profile - Atualizar perfil do usuário
  fastify.put('/profile', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Update user profile',
      tags: ['Profile'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          ln_markets_api_key: { type: 'string' },
          ln_markets_api_secret: { type: 'string' },
          ln_markets_passphrase: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                plan_type: { type: 'string' },
                created_at: { type: 'string' },
                last_activity_at: { type: 'string' },
                ln_markets_api_key: { type: 'string' },
                ln_markets_api_secret: { type: 'string' },
                ln_markets_passphrase: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return profileController.updateProfile(request, reply);
  });
}

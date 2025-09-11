import { FastifyInstance } from 'fastify';
import { ProfileController } from '@/controllers/profile.controller';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const profileController = new ProfileController(prisma);

export async function profileRoutes(fastify: FastifyInstance) {
  // GET /api/profile - Buscar perfil do usuário (sem middleware para debug)
  fastify.get('/profile', async (_request, reply) => {
    try {
      console.log('🔍 PROFILE ROUTE - Testing without middleware');
      
      const profile = await prisma.user.findUnique({
        where: { id: 'fd5dc745-fa1d-40eb-848f-f1b4a6470c07' },
        select: {
          id: true,
          email: true,
          username: true,
          plan_type: true,
          created_at: true,
          last_activity_at: true,
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!profile) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      return reply.status(200).send({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('❌ PROFILE ROUTE - Error:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch profile',
      });
    }
  });

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

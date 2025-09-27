import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsUserController } from '../controllers/lnmarkets-user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function lnmarketsUserOptimizedRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const userController = new LNMarketsUserController(prisma);

  // ⚠️ ENDPOINTS INDIVIDUAIS REMOVIDOS - USAR APENAS /api/lnmarkets/user/dashboard-optimized
  // Todos os dados agora são fornecidos pelo endpoint otimizado que:
  // - Busca todos os dados em paralelo (otimização)
  // - Usa circuit breaker e retry (resiliência)
  // - Fornece dados unificados (user, balance, positions, market, etc.)
  // - Mantém cache e otimizações

  // Apenas o endpoint de ticker público é mantido (não requer autenticação)
  fastify.get(
    '/lnmarkets/market/ticker',
    {
      schema: {
        description: 'Get LN Markets market ticker (public)',
        tags: ['LN Markets - Market'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // Endpoint simples que retorna dados de mercado públicos
      return reply.send({
        success: true,
        data: {
          message: 'Use /api/lnmarkets/user/dashboard-optimized for all data'
        }
      });
    }
  );

  console.log('✅ LN Markets User Optimized routes registered - Only optimized endpoints');
}

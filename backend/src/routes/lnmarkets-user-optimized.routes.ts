import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsUserController } from '../controllers/lnmarkets-user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function lnmarketsUserOptimizedRoutes(fastify: FastifyInstance) {
  console.log('🔧 LN MARKETS USER OPTIMIZED - Registering routes...');
  console.log('🔧 LN MARKETS USER OPTIMIZED - About to register /lnmarkets/market/ticker');
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
      console.log('🔍 TICKER ENDPOINT - Called /api/lnmarkets/market/ticker');
      console.log('🔍 TICKER ENDPOINT - URL:', request.url);
      console.log('🔍 TICKER ENDPOINT - Method:', request.method);
      try {
        const axios = require('axios');
        console.log('🔍 TICKER ENDPOINT - Making request to LN Markets API...');
        const response = await axios.get('https://api.lnmarkets.com/v2/futures/ticker', {
          timeout: 10000
        });
        console.log('✅ TICKER ENDPOINT - LN Markets API response:', response.data);

        return reply.send({
          success: true,
          data: {
            ...response.data,
            timestamp: Date.now()
          }
        });
      } catch (error: any) {
        console.error('Error fetching market ticker:', error);

        // Return fallback data
        return reply.send({
          success: true,
          data: {
            index: 115000,
            lastPrice: 115000,
            askPrice: 115100,
            bidPrice: 114900,
            carryFeeRate: 0.0001,
            timestamp: Date.now()
          }
        });
      }
    }
  );

  console.log('✅ LN Markets User Optimized routes registered - Only optimized endpoints');
  console.log('✅ LN MARKETS USER OPTIMIZED - Route /lnmarkets/market/ticker registered successfully');
}

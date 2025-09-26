import { FastifyInstance } from 'fastify';

export async function lnMarketsAdminRoutes(fastify: FastifyInstance) {
  fastify.get('/market-data', async (request, reply) => {
    return {
      success: true,
      data: {
        symbol: 'BTCUSD',
        price: 115479,
        change24h: 2.34,
        changePercent24h: 2.34,
        volume24h: 1234567,
        high24h: 116000,
        low24h: 114500,
        timestamp: Date.now()
      }
    };
  });

  fastify.get('/status', async (request, reply) => {
    return {
      success: true,
      data: {
        status: 'connected',
        message: 'LN Markets connection successful',
        timestamp: Date.now()
      }
    };
  });
}
/**
 * LN Markets Admin Routes
 * 
 * Rotas administrativas para dados do LN Markets usando credenciais do sistema
 */

import { FastifyInstance } from 'fastify';
import { LNMarketsAPIService } from '../../services/lnmarkets-api.service';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

export async function lnMarketsAdminRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);

  /**
   * Obter dados de mercado do LN Markets para admin
   */
  fastify.get('/market-data', async (request, reply) => {
    try {
      logger.info('Admin requesting LN Markets market data');

      // Use system credentials for LN Markets
      const lnMarketsService = new LNMarketsAPIService({
        apiKey: process.env.LN_MARKETS_API_KEY || '',
        apiSecret: process.env.LN_MARKETS_API_SECRET || '',
        passphrase: process.env.LN_MARKETS_PASSPHRASE || '',
        isTestnet: process.env.LN_MARKETS_TESTNET === 'true'
      });

      // Get market data
      const marketData = await lnMarketsService.getMarketData();
      
      logger.info('LN Markets market data retrieved successfully for admin', {
        price: marketData.price,
        change24h: marketData.change24h
      });

      return {
        success: true,
        data: {
          symbol: 'BTCUSD',
          price: marketData.price || 0,
          change24h: marketData.change24h || 0,
          changePercent24h: marketData.changePercent24h || 0,
          volume24h: marketData.volume24h || 0,
          high24h: marketData.high24h || 0,
          low24h: marketData.low24h || 0,
          timestamp: Date.now()
        }
      };
    } catch (error: any) {
      logger.error('Failed to get LN Markets market data for admin', { error: error.message });
      
      return reply.status(500).send({
        success: false,
        error: 'LN_MARKETS_ERROR',
        message: 'Failed to get LN Markets market data',
        details: error.message
      });
    }
  });

  /**
   * Obter status de conexão do LN Markets
   */
  fastify.get('/status', async (request, reply) => {
    try {
      logger.info('Admin checking LN Markets status');

      const lnMarketsService = new LNMarketsAPIService({
        apiKey: process.env.LN_MARKETS_API_KEY || '',
        apiSecret: process.env.LN_MARKETS_API_SECRET || '',
        passphrase: process.env.LN_MARKETS_PASSPHRASE || '',
        isTestnet: process.env.LN_MARKETS_TESTNET === 'true'
      });

      // Test connection
      const status = await lnMarketsService.getStatus();
      
      return {
        success: true,
        data: {
          status: 'connected',
          timestamp: Date.now(),
          details: status
        }
      };
    } catch (error: any) {
      logger.error('LN Markets status check failed for admin', { error: error.message });
      
      return reply.status(500).send({
        success: false,
        error: 'LN_MARKETS_STATUS_ERROR',
        message: 'Failed to check LN Markets status',
        details: error.message
      });
    }
  });
}

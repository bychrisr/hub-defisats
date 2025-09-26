import { FastifyInstance } from 'fastify';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../services/auth.service';
import { LNMarketsAPIService } from '../../services/lnmarkets-api.service';
import { logger } from '../../utils/logger';

export async function lnMarketsAdminRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);
  
  const prisma = new PrismaClient();
  const authService = new AuthService(prisma, {} as any);
  fastify.get('/market-data', async (request, reply) => {
    try {
      logger.info('Admin requesting LN Markets market data');
      
      const user = (request as any).user;
      
      // Get admin user credentials
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!adminUser || !adminUser.ln_markets_api_key || !adminUser.ln_markets_api_secret || !adminUser.ln_markets_passphrase) {
        logger.warn('Admin user does not have LN Markets credentials configured');
        // Return mock data if no credentials configured
        const marketData = {
          symbol: 'BTCUSD',
          price: 115479,
          change24h: 2.34,
          changePercent24h: 2.34,
          volume24h: 1234567,
          high24h: 116000,
          low24h: 114500,
          timestamp: Date.now()
        };
        
        return {
          success: true,
          data: marketData,
          source: 'mock'
        };
      }
      
      // Decrypt credentials
      const apiKey = authService.decryptData(adminUser.ln_markets_api_key);
      const apiSecret = authService.decryptData(adminUser.ln_markets_api_secret);
      const passphrase = authService.decryptData(adminUser.ln_markets_passphrase);
      
      // Create LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false
      }, logger);
      
      // Get real market data
      const marketData = await lnMarketsService.getMarketData();
      
      logger.info('LN Markets market data retrieved successfully for admin', {
        price: marketData.price,
        change24h: marketData.change24h
      });
      
      return {
        success: true,
        data: marketData,
        source: 'real'
      };
    } catch (error: any) {
      logger.error('Error fetching LN Markets admin market data:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch LN Markets admin market data',
        error: error.message
      });
    }
  });

  fastify.get('/status', async (request, reply) => {
    try {
      logger.info('Admin checking LN Markets status');
      
      const user = (request as any).user;
      
      // Get admin user credentials
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!adminUser || !adminUser.ln_markets_api_key || !adminUser.ln_markets_api_secret || !adminUser.ln_markets_passphrase) {
        logger.warn('Admin user does not have LN Markets credentials configured');
        // Return mock status if no credentials configured
        return {
          success: true,
          data: {
            status: 'not_configured',
            message: 'LN Markets credentials not configured',
            timestamp: Date.now()
          }
        };
      }
      
      // Decrypt credentials
      const apiKey = authService.decryptData(adminUser.ln_markets_api_key);
      const apiSecret = authService.decryptData(adminUser.ln_markets_api_secret);
      const passphrase = authService.decryptData(adminUser.ln_markets_passphrase);
      
      // Create LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false
      }, logger);
      
      // Test connection
      const status = await lnMarketsService.testConnection();
      
      logger.info('LN Markets status check completed for admin', {
        status: status.success ? 'connected' : 'failed'
      });
      
      return {
        success: true,
        data: {
          status: status.success ? 'connected' : 'failed',
          message: status.success ? 'LN Markets connection successful' : 'LN Markets connection failed',
          timestamp: Date.now(),
          details: status
        }
      };
    } catch (error: any) {
      logger.error('Error checking LN Markets status:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to check LN Markets status',
        error: error.message
      });
    }
  });
}
/**
 * LN Markets Admin Routes - Robust Implementation
 * 
 * Complete implementation with real LN Markets integration
 */

import { FastifyInstance } from 'fastify';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../../services/auth.service';
import { LNMarketsAPIv2 } from '../../services/lnmarkets/LNMarketsAPIv2.service';
import { logger } from '../../utils/logger';

export async function lnMarketsAdminRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);
  
  const prisma = new PrismaClient();
  const authService = new AuthService(prisma, fastify);

  /**
   * Get LN Markets market data for admin
   */
  fastify.get('/market-data', async (request, reply) => {
    try {
      logger.info('Admin requesting LN Markets market data');
      
      const user = (request as any).user;
      
      // Get admin user credentials
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!adminUser) {
        logger.error('Admin user not found', { userId: user.id });
        return reply.status(404).send({
          success: false,
          message: 'Admin user not found',
          error: 'USER_NOT_FOUND'
        });
      }
      
      if (!adminUser.ln_markets_api_key || !adminUser.ln_markets_api_secret || !adminUser.ln_markets_passphrase) {
        logger.warn('Admin user does not have LN Markets credentials configured', { userId: user.id });
        return reply.status(400).send({
          success: false,
          message: 'LN Markets credentials not configured. Please configure them in Settings.',
          error: 'CREDENTIALS_NOT_CONFIGURED',
          details: {
            missingFields: {
              apiKey: !adminUser.ln_markets_api_key,
              apiSecret: !adminUser.ln_markets_api_secret,
              passphrase: !adminUser.ln_markets_passphrase
            }
          }
        });
      }
      
      // Decrypt credentials
      let apiKey: string;
      let apiSecret: string;
      let passphrase: string;
      
      try {
        apiKey = authService.decryptData(adminUser.ln_markets_api_key);
        apiSecret = authService.decryptData(adminUser.ln_markets_api_secret);
        passphrase = authService.decryptData(adminUser.ln_markets_passphrase);
      } catch (decryptError: any) {
        logger.error('Failed to decrypt LN Markets credentials', { 
          userId: user.id, 
          error: decryptError.message 
        });
        return reply.status(500).send({
          success: false,
          message: 'Failed to decrypt LN Markets credentials',
          error: 'DECRYPTION_FAILED'
        });
      }
      
      // Create LN Markets service
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false
        },
        logger: logger as any
      });
      
      // Get real market data
      const marketData = await lnMarketsService.getMarketData();
      
      logger.info('LN Markets market data retrieved successfully for admin', {
        userId: user.id,
        price: marketData.price,
        change24h: marketData.change24h,
        symbol: marketData.symbol
      });
      
      return {
        success: true,
        data: marketData,
        source: 'real',
        timestamp: Date.now(),
        user: {
          id: user.id,
          email: adminUser.email
        }
      };
    } catch (error: any) {
      logger.error('Error fetching LN Markets admin market data:', {
        error: error.message,
        stack: error.stack,
        userId: (request as any).user?.id
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch LN Markets market data',
        error: error.message,
        details: {
          type: error.name || 'UnknownError',
          timestamp: Date.now()
        }
      });
    }
  });

  /**
   * Get LN Markets connection status for admin
   */
  fastify.get('/status', async (request, reply) => {
    try {
      logger.info('Admin checking LN Markets status');
      
      const user = (request as any).user;
      
      // Get admin user credentials
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!adminUser) {
        logger.error('Admin user not found', { userId: user.id });
        return reply.status(404).send({
          success: false,
          message: 'Admin user not found',
          error: 'USER_NOT_FOUND'
        });
      }
      
      if (!adminUser.ln_markets_api_key || !adminUser.ln_markets_api_secret || !adminUser.ln_markets_passphrase) {
        logger.warn('Admin user does not have LN Markets credentials configured', { userId: user.id });
        return reply.status(400).send({
          success: false,
          message: 'LN Markets credentials not configured. Please configure them in Settings.',
          error: 'CREDENTIALS_NOT_CONFIGURED',
          details: {
            missingFields: {
              apiKey: !adminUser.ln_markets_api_key,
              apiSecret: !adminUser.ln_markets_api_secret,
              passphrase: !adminUser.ln_markets_passphrase
            }
          }
        });
      }
      
      // Decrypt credentials
      let apiKey: string;
      let apiSecret: string;
      let passphrase: string;
      
      try {
        apiKey = authService.decryptData(adminUser.ln_markets_api_key);
        apiSecret = authService.decryptData(adminUser.ln_markets_api_secret);
        passphrase = authService.decryptData(adminUser.ln_markets_passphrase);
      } catch (decryptError: any) {
        logger.error('Failed to decrypt LN Markets credentials', { 
          userId: user.id, 
          error: decryptError.message 
        });
        return reply.status(500).send({
          success: false,
          message: 'Failed to decrypt LN Markets credentials',
          error: 'DECRYPTION_FAILED'
        });
      }
      
      // Create LN Markets service
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false
        },
        logger: logger as any
      });
      
      // Test connection
      const status = await lnMarketsService.testConnection();
      
      logger.info('LN Markets status check completed for admin', {
        userId: user.id,
        status: status.success ? 'connected' : 'failed',
        message: status.message
      });
      
      return {
        success: true,
        data: {
          status: status.success ? 'connected' : 'failed',
          message: status.success ? 'LN Markets connection successful' : 'LN Markets connection failed',
          timestamp: Date.now(),
          details: status,
          user: {
            id: user.id,
            email: adminUser.email
          }
        }
      };
    } catch (error: any) {
      logger.error('Error checking LN Markets status:', {
        error: error.message,
        stack: error.stack,
        userId: (request as any).user?.id
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to check LN Markets status',
        error: error.message,
        details: {
          type: error.name || 'UnknownError',
          timestamp: Date.now()
        }
      });
    }
  });

  /**
   * Test LN Markets connection with current credentials
   */
  fastify.post('/test-connection', async (request, reply) => {
    try {
      logger.info('Admin testing LN Markets connection');
      
      const user = (request as any).user;
      
      // Get admin user credentials
      const adminUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!adminUser) {
        logger.error('Admin user not found', { userId: user.id });
        return reply.status(404).send({
          success: false,
          message: 'Admin user not found',
          error: 'USER_NOT_FOUND'
        });
      }
      
      if (!adminUser.ln_markets_api_key || !adminUser.ln_markets_api_secret || !adminUser.ln_markets_passphrase) {
        logger.warn('Admin user does not have LN Markets credentials configured', { userId: user.id });
        return reply.status(400).send({
          success: false,
          message: 'LN Markets credentials not configured. Please configure them in Settings.',
          error: 'CREDENTIALS_NOT_CONFIGURED'
        });
      }
      
      // Decrypt credentials
      let apiKey: string;
      let apiSecret: string;
      let passphrase: string;
      
      try {
        apiKey = authService.decryptData(adminUser.ln_markets_api_key);
        apiSecret = authService.decryptData(adminUser.ln_markets_api_secret);
        passphrase = authService.decryptData(adminUser.ln_markets_passphrase);
      } catch (decryptError: any) {
        logger.error('Failed to decrypt LN Markets credentials', { 
          userId: user.id, 
          error: decryptError.message 
        });
        return reply.status(500).send({
          success: false,
          message: 'Failed to decrypt LN Markets credentials',
          error: 'DECRYPTION_FAILED'
        });
      }
      
      // Create LN Markets service
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false
        },
        logger: logger as any
      });
      
      // Test connection
      const testResult = await lnMarketsService.testConnection();
      
      logger.info('LN Markets connection test completed for admin', {
        userId: user.id,
        success: testResult.success,
        message: testResult.message
      });
      
      return {
        success: true,
        data: {
          connected: testResult.success,
          message: testResult.message,
          timestamp: Date.now(),
          details: testResult,
          user: {
            id: user.id,
            email: adminUser.email
          }
        }
      };
    } catch (error: any) {
      logger.error('Error testing LN Markets connection:', {
        error: error.message,
        stack: error.stack,
        userId: (request as any).user?.id
      });
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to test LN Markets connection',
        error: error.message,
        details: {
          type: error.name || 'UnknownError',
          timestamp: Date.now()
        }
      });
    }
  });
}
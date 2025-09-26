/**
 * Admin Settings Routes
 * 
 * Rotas administrativas para configurações do sistema
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { adminAuthMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function settingsRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', adminAuthMiddleware);

  /**
   * Obter configurações do sistema
   */
  fastify.get('/settings', async (request, reply) => {
    try {
      logger.info('Admin requesting system settings');

      // Get system settings from database or environment
      const settings = {
        lnMarkets: {
          apiKey: process.env.LN_MARKETS_API_KEY ? '***' + process.env.LN_MARKETS_API_KEY.slice(-4) : '',
          apiSecret: process.env.LN_MARKETS_API_SECRET ? '***' + process.env.LN_MARKETS_API_SECRET.slice(-4) : '',
          passphrase: process.env.LN_MARKETS_PASSPHRASE ? '***' + process.env.LN_MARKETS_PASSPHRASE.slice(-4) : '',
          testnet: process.env.LN_MARKETS_TESTNET === 'true',
          baseUrl: process.env.LN_MARKETS_API_URL || 'https://api.lnmarkets.com'
        },
        system: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '1.0.0',
          debug: process.env.DEBUG === 'true'
        },
        database: {
          url: process.env.DATABASE_URL ? '***' + process.env.DATABASE_URL.split('@')[1] : '',
          maxConnections: process.env.DATABASE_MAX_CONNECTIONS || '10'
        }
      };

      return {
        success: true,
        data: settings
      };
    } catch (error: any) {
      logger.error('Failed to get system settings', { error: error.message });
      
      return reply.status(500).send({
        success: false,
        error: 'SETTINGS_ERROR',
        message: 'Failed to get system settings',
        details: error.message
      });
    }
  });

  /**
   * Atualizar configurações do LN Markets
   */
  fastify.put('/settings/lnmarkets', {
    schema: {
      body: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          apiSecret: { type: 'string' },
          passphrase: { type: 'string' },
          testnet: { type: 'boolean' }
        },
        required: ['apiKey', 'apiSecret', 'passphrase']
      }
    }
  }, async (request, reply) => {
    try {
      const { apiKey, apiSecret, passphrase, testnet } = request.body as any;
      
      logger.info('Admin updating LN Markets settings');

      // Validate credentials by testing connection
      const { LNMarketsAPIService } = await import('../../services/lnmarkets-api.service');
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: testnet || false
      });

      // Test connection
      await lnMarketsService.getStatus();

      // Store in database (encrypted)
      const authService = new (await import('../../services/auth.service')).AuthService(prisma, {} as any);
      
      // Get or create system settings record
      let systemSettings = await prisma.systemSettings.findFirst();
      if (!systemSettings) {
        systemSettings = await prisma.systemSettings.create({
          data: {
            key: 'lnmarkets_credentials',
            value: '{}',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      }

      // Encrypt and store credentials
      const credentials = {
        apiKey: authService.encryptData(apiKey),
        apiSecret: authService.encryptData(apiSecret),
        passphrase: authService.encryptData(passphrase),
        testnet: testnet || false,
        updated_at: new Date()
      };

      await prisma.systemSettings.update({
        where: { id: systemSettings.id },
        data: {
          value: JSON.stringify(credentials),
          updated_at: new Date()
        }
      });

      logger.info('LN Markets settings updated successfully');

      return {
        success: true,
        message: 'LN Markets settings updated successfully',
        data: {
          testnet: testnet || false,
          updated_at: new Date()
        }
      };
    } catch (error: any) {
      logger.error('Failed to update LN Markets settings', { error: error.message });
      
      return reply.status(400).send({
        success: false,
        error: 'LN_MARKETS_UPDATE_ERROR',
        message: 'Failed to update LN Markets settings',
        details: error.message
      });
    }
  });

  /**
   * Testar conexão com LN Markets
   */
  fastify.post('/settings/lnmarkets/test', {
    schema: {
      body: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          apiSecret: { type: 'string' },
          passphrase: { type: 'string' },
          testnet: { type: 'boolean' }
        },
        required: ['apiKey', 'apiSecret', 'passphrase']
      }
    }
  }, async (request, reply) => {
    try {
      const { apiKey, apiSecret, passphrase, testnet } = request.body as any;
      
      logger.info('Admin testing LN Markets connection');

      const { LNMarketsAPIService } = await import('../../services/lnmarkets-api.service');
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: testnet || false
      });

      // Test connection
      const status = await lnMarketsService.getStatus();
      const marketData = await lnMarketsService.getMarketData();

      logger.info('LN Markets connection test successful');

      return {
        success: true,
        message: 'LN Markets connection test successful',
        data: {
          status,
          marketData: {
            price: marketData.price,
            change24h: marketData.change24h,
            timestamp: Date.now()
          },
          testnet: testnet || false
        }
      };
    } catch (error: any) {
      logger.error('LN Markets connection test failed', { error: error.message });
      
      return reply.status(400).send({
        success: false,
        error: 'LN_MARKETS_TEST_ERROR',
        message: 'Failed to connect to LN Markets',
        details: error.message
      });
    }
  });

  /**
   * Obter logs do sistema
   */
  fastify.get('/settings/logs', async (request, reply) => {
    try {
      logger.info('Admin requesting system logs');

      // Get recent logs (this would need to be implemented based on your logging system)
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'System started successfully',
          source: 'system'
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warn',
          message: 'High memory usage detected',
          source: 'monitor'
        }
      ];

      return {
        success: true,
        data: {
          logs,
          total: logs.length
        }
      };
    } catch (error: any) {
      logger.error('Failed to get system logs', { error: error.message });
      
      return reply.status(500).send({
        success: false,
        error: 'LOGS_ERROR',
        message: 'Failed to get system logs',
        details: error.message
      });
    }
  });
}

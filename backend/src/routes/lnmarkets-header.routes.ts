/**
 * LN Markets Header Data Routes
 * 
 * Endpoint otimizado para dados específicos do header da LN Markets
 * - Trading Fees (cache 5min)
 * - Next Funding (cache 1min) 
 * - Rate (cache 30s)
 * - Validação rigorosa
 * - Suporte a testnet
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { LNMarketsOptimizedService } from '../services/lnmarkets-optimized.service';
import { TestnetDetector } from '../utils/testnet-detector';
import { MarketDataValidator } from '../utils/market-data-validator';

export async function lnMarketsHeaderRoutes(fastify: FastifyInstance) {
  console.log('🚀 LN MARKETS HEADER ROUTES - Module loaded!');
  const prisma = new PrismaClient();

  /**
   * GET /api/lnmarkets/header-data
   * 
   * Endpoint para dados específicos do header LN Markets
   * Retorna: tradingFees, nextFunding, rate, rateChange
   */
  fastify.get('/header-data', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get LN Markets specific header data (trading fees, next funding, rate)',
      tags: ['LN Markets - Header'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                tradingFees: { type: 'number' },
                nextFunding: { type: 'string' },
                rate: { type: 'number' },
                rateChange: { type: 'number' },
                timestamp: { type: 'number' },
                source: { type: 'string' },
                network: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        503: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    console.log('🚀 LN MARKETS HEADER ROUTE - Route called!');
    try {
      const user = (request as any).user;
      
      console.log('🔄 LN MARKETS HEADER - Request received:', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });

      // Buscar credenciais do usuário ativo (já descriptografadas pelo AccountCredentialsService)
      const { AccountCredentialsService } = await import('../services/account-credentials.service');
      const accountCredentialsService = new AccountCredentialsService(prisma);
      
      const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(user.id);
      
      console.log('🔍 LN MARKETS HEADER - Active credentials:', {
        hasCredentials: !!activeCredentials,
        exchangeName: activeCredentials?.exchangeName,
        isActive: activeCredentials?.isActive
      });
      
        if (!activeCredentials || !activeCredentials.exchangeName || !activeCredentials.exchangeName.toLowerCase().includes('ln markets')) {
          console.warn('⚠️ LN MARKETS HEADER - No active LN Markets account found');
          return reply.status(400).send({
            success: false,
            error: 'NO_LN_MARKETS_ACCOUNT',
            message: 'No active LN Markets account found'
          });
        }

      // As credenciais já estão descriptografadas pelo AccountCredentialsService
      const decryptedCredentials = activeCredentials.credentials;
      
      console.log('🔍 LN MARKETS HEADER - Decrypted credentials:', {
        hasApiKey: !!decryptedCredentials['API Key'],
        hasApiSecret: !!decryptedCredentials['API Secret'],
        hasPassphrase: !!decryptedCredentials['Passphrase'],
        isTestnet: decryptedCredentials.isTestnet
      });

      // Detectar testnet
      const testnetResult = TestnetDetector.detectTestnet(decryptedCredentials);
      
      console.log('🌐 LN MARKETS HEADER - Testnet detection:', {
        isTestnet: testnetResult.isTestnet,
        reason: testnetResult.reason,
        confidence: testnetResult.confidence
      });

      // Criar serviço otimizado
      const lnMarketsOptimized = new LNMarketsOptimizedService({
        apiKey: decryptedCredentials['API Key'],
        apiSecret: decryptedCredentials['API Secret'],
        passphrase: decryptedCredentials['Passphrase'],
        isTestnet: testnetResult.isTestnet
      });

      // Buscar dados específicos
      console.log('🔄 LN MARKETS HEADER - Fetching specific data...');
      const specificData = await lnMarketsOptimized.getSpecificData();

      // Validar dados combinados
      const combinedData = {
        index: specificData.rate.index || 0, // Adicionar campo index
        tradingFees: specificData.tradingFees.tradingFees,
        nextFunding: specificData.nextFunding.nextFunding,
        rate: specificData.rate.rate,
        rateChange: specificData.rate.rateChange,
        timestamp: Date.now()
      };

      const validation = MarketDataValidator.validateLNMarketsData(combinedData);

      if (!validation.valid) {
        console.error('❌ LN MARKETS HEADER - Data validation failed:', validation.reason);
        return reply.status(503).send({
          success: false,
          error: 'DATA_VALIDATION_FAILED',
          message: 'LN Markets header data validation failed',
          details: validation.reason
        });
      }

      const responseData = {
        index: specificData.rate.index || 0, // Adicionar campo index
        tradingFees: specificData.tradingFees.tradingFees,
        nextFunding: specificData.nextFunding.nextFunding,
        rate: specificData.rate.rate,
        rateChange: specificData.rate.rateChange,
        timestamp: Date.now(),
        source: 'lnmarkets-optimized',
        network: testnetResult.isTestnet ? 'testnet' : 'mainnet'
      };

      console.log('✅ LN MARKETS HEADER - Data fetched successfully:', {
        tradingFees: responseData.tradingFees,
        nextFunding: responseData.nextFunding,
        rate: responseData.rate,
        rateChange: responseData.rateChange,
        isTestnet: testnetResult.isTestnet,
        sources: {
          tradingFees: specificData.tradingFees.source,
          nextFunding: specificData.nextFunding.source,
          rate: specificData.rate.source
        }
      });

      return reply.send({
        success: true,
        data: responseData
      });

    } catch (error: any) {
      console.error('❌ LN MARKETS HEADER - Error:', error);
      
      return reply.status(503).send({
        success: false,
        error: 'LN_MARKETS_HEADER_ERROR',
        message: 'LN Markets header data temporarily unavailable - no fallback data for security',
        details: error.message,
        timestamp: Date.now()
      });
    }
  });

  /**
   * GET /api/lnmarkets/header-data/cache-stats
   * 
   * Endpoint para estatísticas do cache (debug)
   */
  fastify.get('/header-data/cache-stats', {
    schema: {
      description: 'Get LN Markets header cache statistics (debug)',
      tags: ['LN Markets - Header'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                cacheStats: { type: 'object' },
                debugInfo: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      
      // Buscar credenciais do usuário ativo
      const { AccountCredentialsService } = await import('../services/account-credentials.service');
      const accountCredentialsService = new AccountCredentialsService(prisma);
      
      const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(user.id);
      
      if (!activeCredentials || activeCredentials.exchangeName !== 'lnmarkets') {
        return reply.status(400).send({
          success: false,
          error: 'NO_LN_MARKETS_ACCOUNT',
          message: 'No active LN Markets account found'
        });
      }

      // Detectar testnet
      const testnetResult = TestnetDetector.detectTestnet(activeCredentials.credentials);

      // Criar serviço otimizado
      const lnMarketsOptimized = new LNMarketsOptimizedService({
        apiKey: activeCredentials.credentials['API Key'] || activeCredentials.credentials.api_key,
        apiSecret: activeCredentials.credentials['API Secret'] || activeCredentials.credentials.api_secret,
        passphrase: activeCredentials.credentials['Passphrase'] || activeCredentials.credentials.passphrase,
        isTestnet: testnetResult.isTestnet
      });

      const cacheStats = lnMarketsOptimized.getCacheStats();
      const debugInfo = lnMarketsOptimized.getDebugInfo();

      return reply.send({
        success: true,
        data: {
          cacheStats,
          debugInfo
        }
      });

    } catch (error: any) {
      console.error('❌ LN MARKETS HEADER CACHE - Error:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'CACHE_STATS_ERROR',
        message: 'Failed to get cache statistics',
        details: error.message
      });
    }
  });
}

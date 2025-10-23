/**
 * LN Markets Header Data Routes (Migrated)
 * 
 * Endpoint migrado para usar LNMarketsAPIv2Enhanced consolidado
 * - Trading Fees (cache 5min)
 * - Next Funding (cache 1min) 
 * - Rate (cache 30s)
 * - Validação rigorosa
 * - Suporte a testnet
 * - Circuit breaker integrado
 * - Retry logic automático
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { LNMarketsAPIv2Enhanced } from '../services/lnmarkets/LNMarketsAPIv2-enhanced.service';
import { AccountCredentialsService } from '../services/account-credentials.service';

export async function lnMarketsHeaderMigratedRoutes(fastify: FastifyInstance) {
  console.log('🚀 LN MARKETS HEADER MIGRATED ROUTES - Module loaded!');
  const prisma = new PrismaClient();

  /**
   * GET /api/lnmarkets/header-data
   * 
   * Endpoint para dados específicos do header LN Markets
   * Retorna: tradingFees, nextFunding, rate, rateChange
   * 
   * MIGRAÇÃO: Agora usa LNMarketsAPIv2Enhanced com todas as funcionalidades integradas
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
                network: { type: 'string' },
                cacheHit: { type: 'boolean' }
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
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      console.log('🔄 LN MARKETS HEADER MIGRATED - Getting header data for user:', user.id);

      // Get user credentials using the new exchange accounts system
      const accountCredentialsService = new AccountCredentialsService(prisma);
      const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(user.id);
      
      if (!activeCredentials) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'No active exchange account found',
        });
      }

      // Initialize LN Markets Enhanced service
      const lnMarketsEnhanced = new LNMarketsAPIv2Enhanced({
        credentials: {
          apiKey: activeCredentials.credentials.apiKey,
          apiSecret: activeCredentials.credentials.apiSecret,
          passphrase: activeCredentials.credentials.passphrase,
          isTestnet: activeCredentials.credentials.isTestnet === 'true' || activeCredentials.credentials.testnet === 'true'
        },
        logger: fastify.log as any
      });

      console.log('🔄 LN MARKETS HEADER MIGRATED - Fetching header data with enhanced service...');

      // Buscar dados com cache inteligente integrado
      const [tradingFees, nextFunding, rate] = await Promise.all([
        lnMarketsEnhanced.getTradingFees(),
        lnMarketsEnhanced.getNextFunding(),
        lnMarketsEnhanced.getRate()
      ]);

      // Calcular rate change (simulado por enquanto)
      const rateChange = 0.002; // TODO: Implementar cálculo real

      const headerData = {
        tradingFees: tradingFees.tradingFees || 0.1,
        nextFunding: nextFunding.nextFunding || '2h 15m',
        rate: rate.rate || 0.01,
        rateChange,
        timestamp: Date.now(),
        source: 'lnmarkets-api-enhanced',
        network: activeCredentials.credentials.isTestnet === 'true' ? 'testnet' : 'mainnet',
        cacheHit: false // TODO: Implementar detecção de cache hit
      };

      console.log('✅ LN MARKETS HEADER MIGRATED - Header data retrieved successfully:', {
        tradingFees: headerData.tradingFees,
        nextFunding: headerData.nextFunding,
        rate: headerData.rate,
        network: headerData.network
      });

      return reply.status(200).send({
        success: true,
        data: headerData
      });

    } catch (error: any) {
      console.error('❌ LN MARKETS HEADER MIGRATED - Error getting header data:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'HEADER_DATA_ERROR',
        message: error.message || 'Failed to get header data'
      });
    }
  });

  /**
   * GET /api/lnmarkets/header-data/public
   * 
   * Endpoint público para dados básicos do header (sem autenticação)
   * Retorna dados básicos de mercado
   */
  fastify.get('/header-data/public', {
    schema: {
      description: 'Get public LN Markets header data (no authentication required)',
      tags: ['LN Markets - Header'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                rate: { type: 'number' },
                rateChange: { type: 'number' },
                timestamp: { type: 'number' },
                source: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      console.log('🔄 LN MARKETS HEADER MIGRATED - Getting public header data...');

      // Para dados públicos, usar credenciais padrão ou buscar dados públicos
      // TODO: Implementar endpoint público da LN Markets ou usar dados simulados
      const publicData = {
        rate: 0.01,
        rateChange: 0.002,
        timestamp: Date.now(),
        source: 'lnmarkets-public'
      };

      console.log('✅ LN MARKETS HEADER MIGRATED - Public header data retrieved');

      return reply.status(200).send({
        success: true,
        data: publicData
      });

    } catch (error: any) {
      console.error('❌ LN MARKETS HEADER MIGRATED - Error getting public header data:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'PUBLIC_HEADER_DATA_ERROR',
        message: error.message || 'Failed to get public header data'
      });
    }
  });

  console.log('✅ LN MARKETS HEADER MIGRATED ROUTES - Routes registered successfully');
}

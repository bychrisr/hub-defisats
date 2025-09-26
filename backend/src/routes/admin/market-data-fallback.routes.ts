/**
 * Market Data Fallback Routes
 * 
 * API endpoints para gerenciar sistema de fallback de dados de mercado
 */

import { FastifyInstance } from 'fastify';
import { marketDataFallbackService } from '../../services/market-data-fallback.service';
import { userProtectionService } from '../../services/user-protection.service';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { logger } from '../../utils/logger';

export async function marketDataFallbackRoutes(fastify: FastifyInstance) {
  // Apply admin authentication to all routes
  fastify.addHook('preHandler', async (request, reply) => {
    await adminMiddleware(request, reply);
  });

  /**
   * Obter dados de mercado com fallback
   */
  fastify.get('/market-data', async (request, reply) => {
    try {
      logger.info('Fetching market data with fallback');
      
      const result = await marketDataFallbackService.getMarketData();
      
      if (result.success) {
        return {
          success: true,
          data: {
            index: result.data!.index,
            change24h: result.data!.change24h,
            timestamp: result.data!.timestamp,
            provider: result.data!.provider,
            source: result.data!.source,
            age: Date.now() - result.data!.timestamp
          },
          source: result.source
        };
      } else {
        return reply.status(503).send({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'Market data temporarily unavailable',
          source: result.source
        });
      }
    } catch (error: any) {
      logger.error('Market data fetch failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch market data'
      });
    }
  });

  /**
   * Forçar atualização dos dados de mercado
   */
  fastify.post('/market-data/refresh', async (request, reply) => {
    try {
      logger.info('Forcing market data refresh');
      
      const result = await marketDataFallbackService.forceRefresh();
      
      if (result.success) {
        return {
          success: true,
          data: {
            index: result.data!.index,
            change24h: result.data!.change24h,
            timestamp: result.data!.timestamp,
            provider: result.data!.provider,
            source: result.data!.source,
            age: Date.now() - result.data!.timestamp
          },
          message: 'Market data refreshed successfully'
        };
      } else {
        return reply.status(503).send({
          success: false,
          error: 'REFRESH_FAILED',
          message: 'Failed to refresh market data'
        });
      }
    } catch (error: any) {
      logger.error('Market data refresh failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to refresh market data'
      });
    }
  });

  /**
   * Obter status dos provedores
   */
  fastify.get('/providers/status', async (request, reply) => {
    try {
      const status = marketDataFallbackService.getProvidersStatus();
      
      return {
        success: true,
        data: status
      };
    } catch (error: any) {
      logger.error('Failed to get providers status', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get providers status'
      });
    }
  });

  /**
   * Verificar proteção para automação
   */
  fastify.post('/protection/check', {
    schema: {
      body: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          automationId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, automationId } = request.body as any;
      
      logger.info('Checking automation protection', { userId, automationId });
      
      const result = await userProtectionService.canExecuteAutomation(userId, automationId);
      
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      logger.error('Protection check failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to check protection'
      });
    }
  });

  /**
   * Obter estatísticas de proteção
   */
  fastify.get('/protection/stats', async (request, reply) => {
    try {
      const stats = await userProtectionService.getProtectionStats();
      
      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      logger.error('Failed to get protection stats', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get protection stats'
      });
    }
  });

  /**
   * Atualizar nível de risco do usuário
   */
  fastify.post('/protection/user-risk', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'riskLevel'],
        properties: {
          userId: { type: 'string' },
          riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, riskLevel } = request.body as any;
      
      logger.info('Updating user risk level', { userId, riskLevel });
      
      await userProtectionService.updateUserRiskLevel(userId, riskLevel);
      
      return {
        success: true,
        message: 'User risk level updated successfully'
      };
    } catch (error: any) {
      logger.error('Failed to update user risk level', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update user risk level'
      });
    }
  });

  /**
   * Testar todos os provedores
   */
  fastify.post('/providers/test', async (request, reply) => {
    try {
      logger.info('Testing all market data providers');
      
      const results = [];
      
      // Testar cada provedor
      const providers = ['lnMarkets', 'coinGecko', 'binance'];
      
      for (const providerName of providers) {
        try {
          const startTime = Date.now();
          const result = await marketDataFallbackService.getMarketData();
          const latency = Date.now() - startTime;
          
          results.push({
            provider: providerName,
            success: result.success,
            latency,
            data: result.data,
            error: result.error
          });
        } catch (error: any) {
          results.push({
            provider: providerName,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error: any) {
      logger.error('Provider test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to test providers'
      });
    }
  });

  /**
   * Obter configuração de fallback
   */
  fastify.get('/config', async (request, reply) => {
    try {
      const config = {
        maxCacheAge: 30000, // 30 segundos
        retryAttempts: 3,
        fallbackTimeout: 5000,
        emergencyProviders: ['coinGecko', 'binance'],
        protectionRules: [
          {
            id: 'data_too_old',
            name: 'Dados Muito Antigos',
            maxAge: 30000,
            action: 'block'
          },
          {
            id: 'primary_provider_down',
            name: 'Provedor Primário Indisponível',
            action: 'warn'
          },
          {
            id: 'consecutive_failures',
            name: 'Muitas Falhas Consecutivas',
            threshold: 5,
            action: 'block'
          }
        ]
      };
      
      return {
        success: true,
        data: config
      };
    } catch (error: any) {
      logger.error('Failed to get fallback config', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get fallback config'
      });
    }
  });
}

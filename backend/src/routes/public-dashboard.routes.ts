import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export async function publicDashboardRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  /**
   * GET /api/public/dashboard
   * 
   * Endpoint público para dados de dashboard (sem autenticação)
   * Retorna dados básicos de mercado que podem ser exibidos no header
   */
  fastify.get('/api/public/dashboard', {
    schema: {
      description: 'Get public dashboard data (no authentication required)',
      tags: ['Public Dashboard'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                marketIndex: {
                  type: 'object',
                  properties: {
                    index: { type: 'number' },
                    index24hChange: { type: 'number' },
                    tradingFees: { type: 'number' },
                    nextFunding: { type: 'string' },
                    rate: { type: 'number' },
                    timestamp: { type: 'string' },
                    source: { type: 'string' }
                  }
                },
                systemStatus: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    uptime: { type: 'number' },
                    version: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        503: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🌐 PUBLIC DASHBOARD - Fetching public dashboard data...');

      // Dados mockados para demonstração (sem dependências externas)
      const mockMarketData = {
        index: 122850,
        index24hChange: 0.856,
        tradingFees: 0.1,
        nextFunding: "1m 36s",
        rate: 0.00006,
        timestamp: new Date().toISOString(),
        source: "lnmarkets"
      };

      // Dados do sistema
      const systemStatus = {
        status: 'operational',
        uptime: process.uptime(),
        version: '1.0.0'
      };

      const publicDashboardData = {
        marketIndex: mockMarketData,
        systemStatus
      };

      console.log('✅ PUBLIC DASHBOARD - Data fetched successfully:', {
        hasMarketData: !!mockMarketData,
        systemStatus: systemStatus.status,
        timestamp: new Date().toISOString()
      });

      return reply.send({
        success: true,
        data: publicDashboardData,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('❌ PUBLIC DASHBOARD - Error:', error);

      return reply.status(503).send({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Public dashboard service temporarily unavailable'
      });
    }
  });

  /**
   * GET /api/public/market/index
   * 
   * Endpoint público para dados de mercado (sem autenticação)
   * Proxy para o endpoint de mercado público
   */
  fastify.get('/api/public/market/index', {
    schema: {
      description: 'Get public market index data (no authentication required)',
      tags: ['Public Market Data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                index24hChange: { type: 'number' },
                tradingFees: { type: 'number' },
                nextFunding: { type: 'string' },
                rate: { type: 'number' },
                timestamp: { type: 'string' },
                source: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('🌐 PUBLIC MARKET - Fetching public market data...');

      // ✅ BUSCAR DADOS REAIS DA API PÚBLICA LN MARKETS
      console.log('🌐 PUBLIC MARKET - Fetching real public market data...');
      
      try {
        // Usar API pública LN Markets (sem autenticação)
        const response = await fetch('https://api.lnmarkets.com/v2/futures/ticker', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Axisor-Public/1.0'
          },
          timeout: 10000
        });

        if (!response.ok) {
          throw new Error(`LN Markets public API error: ${response.status}`);
        }

        const publicData = await response.json();
        
        // Validar dados recebidos
        const { MarketDataValidator } = await import('../utils/market-data-validator');
        const validation = MarketDataValidator.validateMarketData({
          index: publicData.index,
          change24h: 0, // API pública não tem change24h
          timestamp: Date.now()
        });

        if (!validation.valid) {
          console.warn('⚠️ PUBLIC MARKET - Data validation failed, using fallback');
          throw new Error(`Data validation failed: ${validation.reason}`);
        }

        const realMarketData = {
          index: publicData.index,
          index24hChange: 0, // API pública não fornece
          tradingFees: 0.1, // Padrão LN Markets
          nextFunding: "Calculating...", // Não disponível na API pública
          rate: publicData.carryFeeRate || 0.00006,
          timestamp: new Date().toISOString(),
          source: "lnmarkets-public-api"
        };

        console.log('✅ PUBLIC MARKET - Real data fetched successfully:', {
          index: realMarketData.index,
          source: realMarketData.source,
          timestamp: realMarketData.timestamp
        });

        return reply.send({
          success: true,
          data: realMarketData,
          timestamp: Date.now()
        });

      } catch (apiError: any) {
        console.error('❌ PUBLIC MARKET - API error:', apiError);
        
        // ❌ NÃO USAR DADOS MOCKADOS - retornar erro transparente
        return reply.status(503).send({
          success: false,
          error: 'PUBLIC_API_UNAVAILABLE',
          message: 'Public market data temporarily unavailable - no fallback data for security',
          details: apiError.message,
          timestamp: Date.now()
        });
      }

      console.log('✅ PUBLIC MARKET - Data fetched successfully:', {
        index: mockMarketData.index,
        source: mockMarketData.source,
        timestamp: new Date().toISOString()
      });

      return reply.send({
        success: true,
        data: mockMarketData,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('❌ PUBLIC MARKET - Error:', error);

      return reply.status(503).send({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Public market service temporarily unavailable'
      });
    }
  });
}

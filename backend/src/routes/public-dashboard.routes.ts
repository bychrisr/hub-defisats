import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

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

      // Dados mockados para demonstração
      const mockMarketData = {
        index: 122850,
        index24hChange: 0.856,
        tradingFees: 0.1,
        nextFunding: "1m 36s",
        rate: 0.00006,
        timestamp: new Date().toISOString(),
        source: "lnmarkets"
      };

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

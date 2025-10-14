import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
import { authMiddleware } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function dashboardOptimizedRoutes(fastify: FastifyInstance) {
  // Endpoint unificado para dados da dashboard
  fastify.get(
    '/lnmarkets/user/dashboard-optimized',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Get optimized dashboard data for LN Markets user',
        tags: ['LN Markets - Dashboard'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  user: { type: 'object' },
                  balance: { type: 'object' },
                  positions: { type: 'array', items: { type: 'object' } },
                  estimatedBalance: { type: 'object' },
                  marketIndex: { type: 'object' },
                  deposits: { type: 'array', items: { type: 'object' } },
                  withdrawals: { type: 'array', items: { type: 'object' } },
                  lastUpdate: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // Headers de deprecação
      reply.headers({
        'Deprecation': 'true',
        'Sunset': 'Wed, 01 Jan 2025 00:00:00 GMT',
        'Warning': '299 - "This endpoint is deprecated, please use /api/lnmarkets/v2/user/dashboard instead"'
      });

      // Log de chamada à rota antiga
      console.log(`[DEPRECATION WARNING] Rota antiga chamada: ${request.method} ${request.url} por usuário ${(request as any).user?.id || 'anônimo'}`);

      // Registrar métricas de deprecação
      const { metrics } = await import('../services/metrics-export');
      const startTime = Date.now();

      try {
        const user = (request as any).user;
        
        console.log(`🚀 DASHBOARD OPTIMIZED - Starting unified data fetch for user: ${user.id}`);
        
        // Buscar credenciais do usuário
        // Get user credentials using the new exchange accounts system
        const { AccountCredentialsService } = await import('../services/account-credentials.service');
        const accountCredentialsService = new AccountCredentialsService(prisma);
        
        const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(user.id);
        
        if (!activeCredentials) {
          return reply.status(400).send({
            success: false,
            error: 'MISSING_CREDENTIALS',
            message: 'No active exchange account found'
          });
        }

        const { apiKey, apiSecret, passphrase } = activeCredentials.credentials;

        // Criar instância do serviço LN Markets v2
        const lnMarketsService = new LNMarketsAPIv2({
          credentials: {
            apiKey,
            apiSecret,
            passphrase,
            isTestnet: false
          },
          logger: console as any
        });

        console.log(`🔄 DASHBOARD OPTIMIZED - Fetching all data in parallel (LNMarketsAPIv2)...`);
        
        // Buscar dados essenciais em paralelo (otimização principal) - LN Markets API v2
        const [
          userData,
          balanceData,
          positionsData,
          marketData
        ] = await Promise.allSettled([
          lnMarketsService.user.getUser(),
          lnMarketsService.user.getUser().then(user => ({ balance: user.balance, synthetic_usd_balance: user.synthetic_usd_balance })),
          lnMarketsService.futures.getRunningPositions(),
          lnMarketsService.market.getTicker()
        ]);

        // Buscar dados opcionais separadamente (podem falhar)
        const [depositsData, withdrawalsData] = await Promise.allSettled([
          lnMarketsService.user.getDeposits('bitcoin').catch(() => []),
          lnMarketsService.user.getWithdrawals().catch(() => [])
        ]);

        // Processar respostas
        console.log('🔍 DASHBOARD OPTIMIZED - Processing responses (API v2):', {
          userData: userData.status,
          balanceData: balanceData.status,
          positionsData: positionsData.status,
          marketData: marketData.status,
          depositsData: depositsData.status,
          withdrawalsData: withdrawalsData.status
        });

        // Debug específico para posições
        if (positionsData.status === 'fulfilled') {
          console.log('🔍 DASHBOARD OPTIMIZED - Positions data:', {
            type: typeof positionsData.value,
            isArray: Array.isArray(positionsData.value),
            length: Array.isArray(positionsData.value) ? positionsData.value.length : 'not array',
            firstItem: Array.isArray(positionsData.value) && positionsData.value.length > 0 ? positionsData.value[0] : 'no items'
          });
        } else {
          console.log('❌ DASHBOARD OPTIMIZED - Positions error:', positionsData.reason);
        }

        const processedData = {
          user: userData.status === 'fulfilled' ? userData.value : null,
          balance: balanceData.status === 'fulfilled' ? balanceData.value : null,
          positions: positionsData.status === 'fulfilled' ? positionsData.value || [] : [],
          estimatedBalance: balanceData.status === 'fulfilled' ? balanceData.value : null, // Same as balance in API v2
          trades: [], // LN Markets API v2 doesn't have separate trades endpoint
          orders: [], // LN Markets API v2 doesn't have separate orders endpoint
          history: [], // LN Markets API v2 doesn't have separate history endpoint
          marketIndex: marketData.status === 'fulfilled' ? marketData.value : null,
          deposits: depositsData.status === 'fulfilled' ? depositsData.value || [] : [],
          withdrawals: withdrawalsData.status === 'fulfilled' ? withdrawalsData.value || [] : [],
          lastUpdate: Date.now()
        };

        console.log('🔍 DASHBOARD OPTIMIZED - Raw balanceData:', balanceData);
        console.log('🔍 DASHBOARD OPTIMIZED - Final balance:', processedData.balance);

        console.log('🔍 DASHBOARD OPTIMIZED - Processed data (API v2):', {
          user: processedData.user ? 'present' : 'null',
          balance: processedData.balance ? 'present' : 'null',
          positions: Array.isArray(processedData.positions) ? processedData.positions.length : 'not array',
          estimatedBalance: processedData.estimatedBalance ? 'present' : 'null',
          marketIndex: processedData.marketIndex ? 'present' : 'null',
          deposits: Array.isArray(processedData.deposits) ? processedData.deposits.length : 'not array',
          withdrawals: Array.isArray(processedData.withdrawals) ? processedData.withdrawals.length : 'not array'
        });

        console.log('🔍 DASHBOARD OPTIMIZED - Balance data details:', {
          balanceData: balanceData.status,
          balanceValue: balanceData.status === 'fulfilled' ? balanceData.value : 'rejected',
          balanceType: typeof balanceData.status === 'fulfilled' ? balanceData.value : 'unknown'
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ DASHBOARD OPTIMIZED - Data fetched successfully in ${duration}ms for user: ${user.id}`);
        console.log(`📊 DASHBOARD OPTIMIZED - Stats (API v2):`, {
          positions: processedData.positions.length,
          deposits: processedData.deposits.length,
          withdrawals: processedData.withdrawals.length,
          marketIndex: processedData.marketIndex ? 'present' : 'null',
          duration: `${duration}ms`
        });

        return reply.send({
          success: true,
          data: processedData
        });

      } catch (error: any) {
        const user = (request as any).user;
        console.error(`❌ DASHBOARD OPTIMIZED - Error for user ${user.id}:`, error);
        
        // Tratamento de erro baseado no roadmap (Circuit Breaker)
        if (error.message?.includes('credentials not configured')) {
          return reply.status(400).send({
            success: false,
            error: 'MISSING_CREDENTIALS',
            message: 'LN Markets credentials not configured'
          });
        }
        
        if (error.message?.includes('Invalid encrypted data format')) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_CREDENTIALS',
            message: 'LN Markets credentials are corrupted or encrypted with a different key. Please reconfigure your API credentials in settings.'
          });
        }

        const duration = Date.now() - startTime;
        metrics.recordDeprecatedEndpointCall('/api/lnmarkets/user/dashboard-optimized', 'GET', 500);
        metrics.recordDeprecatedEndpointDuration('/api/lnmarkets/user/dashboard-optimized', 'GET', duration / 1000);

        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard data'
        });
      } finally {
        const duration = Date.now() - startTime;
        metrics.recordDeprecatedEndpointCall('/api/lnmarkets/user/dashboard-optimized', 'GET', reply.statusCode);
        metrics.recordDeprecatedEndpointDuration('/api/lnmarkets/user/dashboard-optimized', 'GET', duration / 1000);
      }
    }
  );
}

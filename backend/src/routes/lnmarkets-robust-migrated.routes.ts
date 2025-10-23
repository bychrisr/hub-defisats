/**
 * LN Markets Robust Routes (Migrated)
 * 
 * Rotas migradas para usar LNMarketsAPIv2Enhanced consolidado:
 * - Uma única requisição para todos os dados
 * - Circuit breaker integrado
 * - Retry logic automático
 * - Cache inteligente
 * - Rate limiting
 * - Validação rigorosa
 * - Logs detalhados para debugging
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { LNMarketsAPIv2Enhanced } from '../services/lnmarkets/LNMarketsAPIv2-enhanced.service';
import { DashboardDataService } from '../services/dashboard-data.service';
import { AccountCredentialsService } from '../services/account-credentials.service';

export async function lnmarketsRobustMigratedRoutes(fastify: FastifyInstance) {
  console.log('🚀 LN MARKETS ROBUST MIGRATED ROUTES - Initializing...');
  
  const prisma = (fastify as any).prisma as PrismaClient;
  const logger = fastify.log as any;
  
  if (!prisma) {
    throw new Error('Prisma client not available in Fastify instance');
  }
  
  // Initialize multi-account services
  const accountCredentialsService = new AccountCredentialsService(prisma);
  const dashboardDataService = new DashboardDataService({
    prisma,
    accountCredentialsService
  });
  
  console.log('✅ LN MARKETS ROBUST MIGRATED ROUTES - Dependencies injected successfully');

  // ============================================================================
  // ENDPOINT ROBUSTO E OTIMIZADO - ESTRATÉGIA DEFINITIVA (MIGRADO)
  // ============================================================================
  
  fastify.get('/dashboard', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const requestId = `robust-migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n🚀🚀🚀 [${requestId}] ===== LN MARKETS ROBUST MIGRATED DASHBOARD START =====`);
      console.log(`📅 [${requestId}] Timestamp: ${new Date().toISOString()}`);
      console.log(`⏱️ [${requestId}] Start Time: ${startTime}`);
      
      try {
        // ========================================================================
        // FASE 1: AUTENTICAÇÃO E VALIDAÇÃO
        // ========================================================================
        
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            requestId
          });
        }

        console.log(`✅ [${requestId}] User authenticated: ${userId}`);

        // ========================================================================
        // FASE 2: BUSCA DE DADOS DA CONTA ATIVA (MULTI-ACCOUNT)
        // ========================================================================
        
        const dataFetchStartTime = Date.now();
        
        console.log(`🔄 [${requestId}] Fetching dashboard data for active account...`);
        
        const dashboardResult = await dashboardDataService.getDashboardDataWithFallback(userId);
        
        console.log(`✅ [${requestId}] Dashboard data fetched (${Date.now() - dataFetchStartTime}ms):`, {
          success: dashboardResult.success,
          hasActiveAccount: dashboardResult.hasActiveAccount,
          hasData: !!dashboardResult.data,
          accountId: dashboardResult.data?.accountId,
          accountName: dashboardResult.data?.accountName,
          exchangeName: dashboardResult.data?.exchangeName
        });

        // ========================================================================
        // FASE 3: TRATAMENTO DE CASOS SEM CONTA ATIVA
        // ========================================================================
        
        if (!dashboardResult.success || !dashboardResult.hasActiveAccount) {
          console.log(`⚠️ [${requestId}] No active account found, returning public data`);
          
          // Buscar dados do usuário para resposta pública
          const userProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              email: true,
              username: true,
              plan_type: true,
              created_at: true
            }
          });

          return reply.status(200).send({
            success: true,
            data: {
              accountId: null,
              accountName: null,
              exchangeName: null,
              lnMarkets: null,
              user: userProfile,
              metadata: {
                lastUpdate: Date.now(),
                hasActiveAccount: false,
                message: 'No active exchange account found. Please configure one in Settings.',
                requestId
              }
            },
            requestId
          });
        }

        // ========================================================================
        // FASE 4: DADOS DA CONTA ATIVA ENCONTRADOS
        // ========================================================================
        
        console.log(`✅ [${requestId}] Active account found, processing data...`);
        
        const activeAccount = dashboardResult.data;
        const lnMarketsData = activeAccount.lnMarkets;

        // ========================================================================
        // FASE 5: VALIDAÇÃO E ESTRUTURAÇÃO DOS DADOS
        // ========================================================================
        
        if (!lnMarketsData) {
          console.log(`⚠️ [${requestId}] No LN Markets data found in active account`);
          
          return reply.status(200).send({
            success: true,
            data: {
              accountId: activeAccount.accountId,
              accountName: activeAccount.accountName,
              exchangeName: activeAccount.exchangeName,
              lnMarkets: null,
              user: activeAccount.user,
              metadata: {
                lastUpdate: Date.now(),
                hasActiveAccount: true,
                hasData: false,
                message: 'Active account found but no LN Markets data available',
                requestId
              }
            },
            requestId
          });
        }

        // ========================================================================
        // FASE 6: RESPOSTA FINAL ESTRUTURADA
        // ========================================================================
        
        const totalDuration = Date.now() - startTime;
        
        console.log(`✅ [${requestId}] Dashboard data processed successfully (${totalDuration}ms):`, {
          accountId: activeAccount.accountId,
          accountName: activeAccount.accountName,
          exchangeName: activeAccount.exchangeName,
          hasUser: !!lnMarketsData.user,
          hasBalance: !!lnMarketsData.balance,
          hasPositions: !!lnMarketsData.positions,
          hasMarket: !!lnMarketsData.market,
          positionsCount: lnMarketsData.positions?.length || 0,
          totalDuration
        });

        return reply.status(200).send({
          success: true,
          data: {
            accountId: activeAccount.accountId,
            accountName: activeAccount.accountName,
            exchangeName: activeAccount.exchangeName,
            lnMarkets: lnMarketsData,
            user: activeAccount.user,
            metadata: {
              lastUpdate: Date.now(),
              hasActiveAccount: true,
              hasData: true,
              requestId,
              totalDuration
            }
          },
          requestId
        });

      } catch (error: any) {
        const totalDuration = Date.now() - startTime;
        
        console.error(`❌ [${requestId}] Dashboard error (${totalDuration}ms):`, {
          error: error.message,
          stack: error.stack,
          totalDuration
        });

        return reply.status(500).send({
          success: false,
          error: 'DASHBOARD_ERROR',
          message: error.message || 'Internal server error',
          requestId,
          totalDuration
        });
      }
    }
  });

  /**
   * GET /api/lnmarkets-robust/positions
   * 
   * Endpoint para buscar posições com LNMarketsAPIv2Enhanced
   */
  fastify.get('/positions', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = `positions-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const userId = (request as any).user?.id;
        console.log(`🔄 [${requestId}] Fetching positions for user: ${userId}`);

        // Get user credentials
        const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
        
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
          logger: logger
        });

        console.log(`🔄 [${requestId}] Fetching positions data via LNMarketsAPIv2Enhanced...`);

        // Get positions using enhanced service
        const positions = await lnMarketsEnhanced.futures.getRunningPositions();

        console.log(`✅ [${requestId}] Positions data retrieved successfully:`, {
          count: positions.length,
          positions: positions.map(p => ({ id: p.id, side: p.side, pl: p.pl }))
        });

        return reply.status(200).send({
          success: true,
          data: positions,
          requestId
        });

      } catch (error: any) {
        console.error(`❌ [${requestId}] Positions error:`, error);
        
        return reply.status(500).send({
          success: false,
          error: 'POSITIONS_ERROR',
          message: error.message || 'Failed to get positions',
          requestId
        });
      }
    }
  });

  /**
   * GET /api/lnmarkets-robust/balance
   * 
   * Endpoint para buscar saldo com LNMarketsAPIv2Enhanced
   */
  fastify.get('/balance', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = `balance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const userId = (request as any).user?.id;
        console.log(`🔄 [${requestId}] Fetching balance for user: ${userId}`);

        // Get user credentials
        const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
        
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
          logger: logger
        });

        console.log(`🔄 [${requestId}] Fetching balance data via LNMarketsAPIv2Enhanced...`);

        // Get balance using enhanced service
        const balance = await lnMarketsEnhanced.user.getBalance();

        console.log(`✅ [${requestId}] Balance data retrieved successfully:`, {
          balance: balance.balance,
          currency: balance.currency
        });

        return reply.status(200).send({
          success: true,
          data: balance,
          requestId
        });

      } catch (error: any) {
        console.error(`❌ [${requestId}] Balance error:`, error);
        
        return reply.status(500).send({
          success: false,
          error: 'BALANCE_ERROR',
          message: error.message || 'Failed to get balance',
          requestId
        });
      }
    }
  });

  console.log('✅ LN MARKETS ROBUST MIGRATED ROUTES - Routes registered successfully');
}

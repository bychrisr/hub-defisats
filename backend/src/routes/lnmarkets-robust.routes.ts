/**
 * LN Markets Robust Routes
 * 
 * Rotas otimizadas que usam o serviço robusto:
 * - Uma única requisição para todos os dados
 * - Estratégia adaptativa de autenticação
 * - Arquitetura escalável
 * - Logs máximos para debugging
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { LNMarketsRobustService } from '../services/LNMarketsRobustService';
import { DashboardDataService } from '../services/dashboard-data.service';
import { AccountCredentialsService } from '../services/account-credentials.service';

export async function lnmarketsRobustRoutes(fastify: FastifyInstance) {
  console.log('🚀 LN MARKETS ROBUST ROUTES - Initializing...');
  
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
  
  console.log('✅ LN MARKETS ROBUST ROUTES - Dependencies injected successfully');

  // ============================================================================
  // ENDPOINT ROBUSTO E OTIMIZADO - ESTRATÉGIA DEFINITIVA
  // ============================================================================
  
  fastify.get('/dashboard', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const requestId = `robust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n🚀🚀🚀 [${requestId}] ===== LN MARKETS ROBUST DASHBOARD START (MULTI-ACCOUNT) =====`);
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
            },
          });

          // Retornar dados públicos quando usuário não tem conta ativa
          const publicMarketData = {
            index: 122850,
            index24hChange: 0.856,
            tradingFees: 0.1,
            nextFunding: "1m 36s",
            rate: 0.00006,
            timestamp: new Date().toISOString(),
            source: "lnmarkets"
          };

          const publicDashboardData = {
            user: {
              id: userId,
              email: userProfile?.email,
              username: userProfile?.username,
              plan_type: userProfile?.plan_type
            },
            accountId: null,
            accountName: null,
            exchangeName: null,
            balance: null,
            positions: [],
            estimatedBalance: null,
            marketIndex: publicMarketData,
            deposits: [],
            withdrawals: [],
            lastUpdate: Date.now(),
            cacheHit: false,
            credentialsConfigured: false,
            message: dashboardResult.error || 'No active exchange account found. Please configure your exchange credentials and set an active account.'
          };

          return reply.send({
            success: true,
            data: publicDashboardData,
            requestId,
            timestamp: Date.now()
          });
        }

        // ========================================================================
        // FASE 4: ESTRUTURAÇÃO DOS DADOS DA CONTA ATIVA
        // ========================================================================
        
        const processingStartTime = Date.now();
        
        const dashboardData = dashboardResult.data!;
        
        // Buscar dados do usuário para resposta completa
        const userProfile = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            username: true,
            plan_type: true,
          },
        });

        // Construir marketIndex com dados completos do ticker
        const marketIndex = dashboardData.ticker ? {
          index: dashboardData.ticker.index,
          lastPrice: dashboardData.ticker.lastPrice,
          askPrice: dashboardData.ticker.askPrice,
          bidPrice: dashboardData.ticker.bidPrice,
          carryFeeRate: dashboardData.ticker.carryFeeRate,
          carryFeeTimestamp: dashboardData.ticker.carryFeeTimestamp,
          index24hChange: 0, // Não disponível no ticker
          tradingFees: 0.1, // Valor padrão
          // Calcular nextFunding a partir do carryFeeTimestamp
          nextFunding: dashboardData.ticker.carryFeeTimestamp 
            ? (() => {
                const now = Date.now();
                const timeDiff = dashboardData.ticker.carryFeeTimestamp - now;
                if (timeDiff > 0 && timeDiff < 8 * 60 * 60 * 1000) {
                  const hours = Math.floor(timeDiff / (60 * 60 * 1000));
                  const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
                  const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);
                  return `${hours}h ${minutes}m ${seconds}s`;
                }
                // Fallback: calcular baseado no ciclo UTC de 8 horas
                const hours = now / (1000 * 60 * 60);
                const nextFundingHour = (Math.floor(hours / 8) + 1) * 8;
                const nextFundingTime = nextFundingHour * 60 * 60 * 1000;
                const diff = nextFundingTime - now;
                const h = Math.floor(diff / (60 * 60 * 1000));
                const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
                const s = Math.floor((diff % (60 * 1000)) / 1000);
                return `${h}h ${m}m ${s}s`;
              })()
            : "Calculating...",
          // Converter carryFeeRate para formato de porcentagem
          rate: dashboardData.ticker.carryFeeRate 
            ? dashboardData.ticker.carryFeeRate * 100 
            : 0,
          rateChange: 0, // Não disponível no ticker
          timestamp: dashboardData.timestamp || Date.now(),
          source: 'lnmarkets-unified'
        } : null;

        const response = {
          success: true,
          data: {
            // Dados do usuário da nossa plataforma
            user: {
              id: userId,
              email: userProfile?.email,
              username: userProfile?.username,
              plan_type: userProfile?.plan_type,
            },
            
            // Informações da conta ativa
            accountId: dashboardData.accountId,
            accountName: dashboardData.accountName,
            exchangeName: dashboardData.exchangeName,
            
            // Market Index com dados completos
            marketIndex: marketIndex,
            
            // TODOS os dados da LN Markets estruturados
            lnMarkets: {
              // Dados estruturados para fácil acesso
              balance: dashboardData.balance,
              positions: dashboardData.positions,
              ticker: dashboardData.ticker,
              
              // Metadados
              metadata: {
                lastUpdate: new Date(dashboardData.timestamp).toISOString(),
                dataSource: 'dashboard-data-service-multi-account',
                version: '4.0.0',
                accountId: dashboardData.accountId,
                accountName: dashboardData.accountName,
                exchangeName: dashboardData.exchangeName
              }
            },
            
            // Métricas de performance
            performance: {
              totalDuration: Date.now() - startTime,
              dataFetchDuration: Date.now() - dataFetchStartTime,
              processingDuration: Date.now() - processingStartTime,
            },
            
            // Status geral
            status: {
              apiConnected: true,
              dataAvailable: dashboardData.positions.length > 0 || dashboardData.balance !== null,
              lastSync: new Date(dashboardData.timestamp).toISOString(),
              serviceType: 'multi-account-optimized',
              activeAccount: {
                id: dashboardData.accountId,
                name: dashboardData.accountName,
                exchange: dashboardData.exchangeName
              }
            }
          },
          message: `Dashboard data fetched successfully for active account: ${dashboardData.accountName} (${dashboardData.exchangeName})`,
          requestId,
          timestamp: new Date().toISOString(),
          version: '4.0.0'
        };

        logger.info(`🎉 [${requestId}] Request completed successfully in ${Date.now() - startTime}ms`);

        return reply.status(200).send(response);

      } catch (error: any) {
        const errorDuration = Date.now() - startTime;
        
        logger.error(`❌ [${requestId}] Request failed after ${errorDuration}ms:`, {
          error: error.message,
          stack: error.stack
        });
        
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch LN Markets dashboard data',
          requestId,
          timestamp: new Date().toISOString(),
          duration: errorDuration
        });
      }
    }
  });

  // ============================================================================
  // ENDPOINT DE TESTE DE CONECTIVIDADE
  // ============================================================================
  
  fastify.get('/test-connection', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            requestId
          });
        }

        // Buscar credenciais da conta ativa usando o novo sistema
        const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
        
        if (!activeCredentials) {
          return reply.status(400).send({
            success: false,
            error: 'MISSING_CREDENTIALS',
            message: 'No active exchange account found. Please configure your exchange credentials.',
            requestId
          });
        }

        const credentials = activeCredentials.credentials;

        const lnMarketsService = new LNMarketsRobustService({
          ...credentials,
          isTestnet: false,
        }, logger);

        const testResult = await lnMarketsService.testConnection();

        return reply.status(200).send({
          success: true,
          data: testResult,
          requestId,
          timestamp: new Date().toISOString()
        });

      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: error.message,
          requestId,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // ============================================================================
  // ENDPOINT ESPECÍFICO PARA POSIÇÕES
  // ============================================================================
  
  fastify.get('/positions', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const requestId = `positions-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`\n🚀🚀🚀 [${requestId}] ===== LN MARKETS ROBUST POSITIONS START =====`);
      console.log(`📅 [${requestId}] Timestamp: ${new Date().toISOString()}`);
      
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
        // FASE 2: BUSCA DE CREDENCIAIS
        // ========================================================================
        
        const credentialsStartTime = Date.now();
        
        // Buscar credenciais da conta ativa usando o novo sistema
        const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
        
        if (!activeCredentials) {
          return reply.status(400).send({
            success: false,
            error: 'MISSING_CREDENTIALS',
            message: 'No active exchange account found. Please configure your exchange credentials.',
            requestId
          });
        }

        console.log(`✅ [${requestId}] Active account found: ${activeCredentials.accountName} (${activeCredentials.exchangeName})`);

        const credentials = activeCredentials.credentials;

        // ========================================================================
        // FASE 4: BUSCA DE DADOS VIA LN MARKETS ROBUST SERVICE
        // ========================================================================
        
        const dataFetchStartTime = Date.now();
        
        const lnMarketsService = new LNMarketsRobustService({
          ...credentials,
          isTestnet: false,
        }, logger);

        console.log(`🔄 [${requestId}] Fetching positions data via LNMarketsRobustService...`);
        
        // Buscar apenas posições (otimizado)
        const allData = await lnMarketsService.getAllUserData();
        
        console.log(`📊 [${requestId}] Data received:`, {
          hasUser: !!allData.user,
          positionsCount: allData.positions?.length || 0,
          userBalance: allData.user?.balance || 'N/A',
          username: allData.user?.username || 'N/A'
        });

        // ========================================================================
        // FASE 5: PROCESSAMENTO E ESTRUTURAÇÃO DOS DADOS
        // ========================================================================
        
        const processingStartTime = Date.now();
        
        const processedData = {
          // Dados do usuário da nossa plataforma
          user: {
            id: userId,
            email: activeCredentials.userId,
            username: activeCredentials.accountName,
            planType: 'lifetime' // TODO: Buscar do usuário
          },
          
          // Informações da conta ativa
          account: {
            id: activeCredentials.accountId,
            name: activeCredentials.accountName,
            exchange: activeCredentials.exchangeName,
            isActive: activeCredentials.isActive
          },
          
          // Dados específicos das posições da LN Markets
          positions: allData.positions || [],
          
          // Metadados da requisição
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            credentialsFetchTime: credentialsStartTime - startTime,
            dataFetchTime: dataFetchStartTime - credentialsStartTime,
            processingTime: Date.now() - processingStartTime,
            apiCallDuration: Date.now() - dataFetchStartTime
          },
          
          // Status geral
          status: {
            apiConnected: allData ? true : false,
            dataAvailable: allData.positions && allData.positions.length > 0,
            lastSync: new Date().toISOString()
          }
        };

        console.log(`📊 [${requestId}] Data processed successfully (${Date.now() - processingStartTime}ms)`);

        // ========================================================================
        // FASE 6: RESPOSTA OTIMIZADA
        // ========================================================================
        
        const response = {
          success: true,
          data: processedData,
          message: 'LN Markets positions fetched successfully',
          requestId,
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        };

        console.log(`🎉 [${requestId}] Request completed successfully in ${Date.now() - startTime}ms`);

        return reply.status(200).send(response);

      } catch (error: any) {
        const errorDuration = Date.now() - startTime;
        console.error(`❌ [${requestId}] Request failed after ${errorDuration}ms:`, {
          message: error.message,
          stack: error.stack,
          userId: (request as any).user?.id
        });
        
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to fetch LN Markets positions',
          requestId,
          timestamp: new Date().toISOString(),
          duration: errorDuration
        });
      }
    }
  });

  console.log('✅ LN MARKETS ROBUST ROUTES - Initialized successfully');
}

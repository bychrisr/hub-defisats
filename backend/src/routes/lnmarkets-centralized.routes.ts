/**
 * LN Markets Centralized Routes
 * 
 * Centralized routes that consolidate all LN Markets functionality
 * - Market data
 * - User operations
 * - Trading operations
 * - Futures and Options
 * - Optimized endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { LNMarketsMarketRefactoredController } from '../controllers/lnmarkets-market-refactored.controller';
import { LNMarketsUserRefactoredController } from '../controllers/lnmarkets-user-refactored.controller';
import { LNMarketsTradingRefactoredController } from '../controllers/lnmarkets-trading-refactored.controller';

export async function lnmarketsCentralizedRoutes(fastify: FastifyInstance) {
  // ========================================================================
  // INJEÇÃO CORRETA DE DEPENDÊNCIAS - LOGS MÁXIMOS
  // ========================================================================
  
  console.log(`🔧 LN MARKETS CENTRALIZED ROUTES - Initializing...`);
  console.log(`🔧 fastify object:`, typeof fastify);
  console.log(`🔧 fastify keys:`, Object.keys(fastify));
  console.log(`🔧 fastify.prisma:`, typeof (fastify as any).prisma);
  console.log(`🔧 fastify.log:`, typeof fastify.log);
  
  const prisma = (fastify as any).prisma as PrismaClient;
  const logger = fastify.log as any;
  
  console.log(`🔧 prisma after extraction:`, typeof prisma);
  console.log(`🔧 logger after extraction:`, typeof logger);
  
  if (!prisma) {
    console.error(`❌ CRITICAL ERROR: Prisma is undefined!`);
    console.error(`❌ fastify.prisma:`, (fastify as any).prisma);
    throw new Error('Prisma client not available in Fastify instance');
  }
  
  if (!logger) {
    console.error(`❌ CRITICAL ERROR: Logger is undefined!`);
    console.error(`❌ fastify.log:`, fastify.log);
    throw new Error('Logger not available in Fastify instance');
  }
  
  console.log(`✅ LN MARKETS CENTRALIZED ROUTES - Dependencies injected successfully`);

  // Initialize controllers
  const marketController = new LNMarketsMarketRefactoredController(prisma, logger);
  const userController = new LNMarketsUserRefactoredController(prisma, logger);
  const tradingController = new LNMarketsTradingRefactoredController(prisma, logger);

  // ============================================================================
  // ENDPOINT ROBUSTO E ESCALÁVEL - ARQUITETURA DEFINITIVA
  // ============================================================================
  
  fastify.get('/dashboard', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // ========================================================================
      // LOGS MÁXIMOS - INÍCIO DA REQUISIÇÃO
      // ========================================================================
      
      console.log(`\n🚀🚀🚀 [${requestId}] ===== LN MARKETS DASHBOARD START =====`);
      console.log(`📅 [${requestId}] Timestamp: ${new Date().toISOString()}`);
      console.log(`⏱️ [${requestId}] Start Time: ${startTime}`);
      console.log(`🌐 [${requestId}] Request URL: ${request.url}`);
      console.log(`🔗 [${requestId}] Request Method: ${request.method}`);
      console.log(`📡 [${requestId}] Request Headers:`, JSON.stringify(request.headers, null, 2));
      console.log(`🔑 [${requestId}] Authorization Header:`, request.headers.authorization ? 'Present' : 'Missing');
      
      try {
        // ========================================================================
        // FASE 1: VALIDAÇÃO E AUTENTICAÇÃO - LOGS DETALHADOS
        // ========================================================================
        
        console.log(`\n🔍🔍🔍 [${requestId}] ===== FASE 1: AUTENTICAÇÃO =====`);
        console.log(`🔍 [${requestId}] About to access request.user...`);
        console.log(`🔍 [${requestId}] request object type:`, typeof request);
        console.log(`🔍 [${requestId}] request object keys:`, Object.keys(request));
        console.log(`🔍 [${requestId}] request.user exists:`, !!(request as any).user);
        console.log(`🔍 [${requestId}] request.user type:`, typeof (request as any).user);
        console.log(`🔍 [${requestId}] request.user value:`, JSON.stringify((request as any).user, null, 2));
        
        const userId = (request as any).user?.id;
        console.log(`🔍 [${requestId}] Extracted userId:`, userId);
        console.log(`🔍 [${requestId}] userId type:`, typeof userId);
        console.log(`🔍 [${requestId}] userId truthy:`, !!userId);
        
        if (!userId) {
          console.log(`\n❌❌❌ [${requestId}] ===== AUTENTICAÇÃO FALHOU =====`);
          console.log(`❌ [${requestId}] Authentication failed - no user ID`);
          console.log(`❌ [${requestId}] request.user:`, (request as any).user);
          console.log(`❌ [${requestId}] Returning 401 Unauthorized`);
          
          return reply.status(401).send({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
            requestId,
            debug: {
              requestUser: (request as any).user,
              timestamp: new Date().toISOString()
            }
          });
        }

        console.log(`\n✅✅✅ [${requestId}] ===== AUTENTICAÇÃO OK =====`);
        console.log(`✅ [${requestId}] User authenticated successfully`);
        console.log(`✅ [${requestId}] User ID: ${userId}`);
        console.log(`✅ [${requestId}] User object:`, JSON.stringify((request as any).user, null, 2));

        // ========================================================================
        // FASE 2: BUSCA DE CREDENCIAIS - LOGS MÁXIMOS
        // ========================================================================
        
        console.log(`\n🔍🔍🔍 [${requestId}] ===== FASE 2: BUSCA DE CREDENCIAIS =====`);
        console.log(`🔍 [${requestId}] About to query database...`);
        console.log(`🔍 [${requestId}] Database query start time: ${Date.now()}`);
        
        const credentialsStartTime = Date.now();
        
        let userProfile;
        try {
          console.log(`🔍 [${requestId}] About to call prisma.user.findUnique...`);
          console.log(`🔍 [${requestId}] userId:`, userId);
          console.log(`🔍 [${requestId}] userId type:`, typeof userId);
          console.log(`🔍 [${requestId}] prisma object:`, typeof prisma);
          console.log(`🔍 [${requestId}] prisma.user:`, typeof prisma.user);
          console.log(`🔍 [${requestId}] prisma.user.findUnique:`, typeof prisma.user.findUnique);
          
          console.log(`🔍 [${requestId}] Getting user credentials using new exchange accounts system`);
          
          // Get user credentials using the new exchange accounts system
          const { AccountCredentialsService } = await import('../services/account-credentials.service');
          const accountCredentialsService = new AccountCredentialsService(prisma);
          
          const activeCredentials = await accountCredentialsService.getActiveAccountCredentials(userId);
          
          if (!activeCredentials) {
            console.log(`❌ [${requestId}] No active exchange account found for user: ${userId}`);
            return reply.status(400).send({
              success: false,
              error: 'MISSING_CREDENTIALS',
              message: 'No active exchange account found',
            });
          }
          
          console.log(`✅ [${requestId}] Active account found:`, {
            accountName: activeCredentials.accountName,
            exchangeName: activeCredentials.exchangeName,
            hasApiKey: !!activeCredentials.credentials.apiKey,
            hasApiSecret: !!activeCredentials.credentials.apiSecret,
            hasPassphrase: !!activeCredentials.credentials.passphrase
          });
          
          console.log(`\n✅✅✅ [${requestId}] ===== CONSULTA BANCO OK =====`);
          console.log(`✅ [${requestId}] Database query successful`);
          console.log(`✅ [${requestId}] Query duration: ${Date.now() - credentialsStartTime}ms`);
          
        } catch (dbError: any) {
          console.log(`\n❌❌❌ [${requestId}] ===== ERRO NO BANCO =====`);
          console.error(`❌ [${requestId}] Database query failed!`);
          console.error(`❌ [${requestId}] Error message:`, dbError.message);
          console.error(`❌ [${requestId}] Error type:`, typeof dbError);
          console.error(`❌ [${requestId}] Error constructor:`, dbError.constructor.name);
          console.error(`❌ [${requestId}] Error stack:`, dbError.stack);
          console.error(`❌ [${requestId}] Query duration before error: ${Date.now() - credentialsStartTime}ms`);
          
          throw new Error(`Database query failed: ${dbError.message}`);
        }

        // ========================================================================
        // VALIDAÇÃO DE CREDENCIAIS - LOGS MÁXIMOS
        // ========================================================================
        
        console.log(`\n🔍🔍🔍 [${requestId}] ===== VALIDAÇÃO DE CREDENCIAIS =====`);
        console.log(`🔍 [${requestId}] Checking if credentials exist...`);
        console.log(`🔍 [${requestId}] API Key exists:`, !!userProfile?.ln_markets_api_key);
        console.log(`🔍 [${requestId}] API Secret exists:`, !!userProfile?.ln_markets_api_secret);
        console.log(`🔍 [${requestId}] Passphrase exists:`, !!userProfile?.ln_markets_passphrase);
        
        if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
          console.log(`\n❌❌❌ [${requestId}] ===== CREDENCIAIS FALTANDO =====`);
          console.log(`❌ [${requestId}] Missing LN Markets credentials for user: ${userId}`);
          console.log(`❌ [${requestId}] Missing credentials:`, {
            api_key: !userProfile?.ln_markets_api_key,
            api_secret: !userProfile?.ln_markets_api_secret,
            passphrase: !userProfile?.ln_markets_passphrase
          });
          console.log(`❌ [${requestId}] Returning 400 Bad Request`);
          
          return reply.status(400).send({
            success: false,
            error: 'MISSING_CREDENTIALS',
            message: 'LN Markets credentials not configured. Please update your profile.',
            requestId,
            debug: {
              userId,
              missingCredentials: {
                api_key: !userProfile?.ln_markets_api_key,
                api_secret: !userProfile?.ln_markets_api_secret,
                passphrase: !userProfile?.ln_markets_passphrase
              },
              timestamp: new Date().toISOString()
            }
          });
        }

        console.log(`\n✅✅✅ [${requestId}] ===== CREDENCIAIS OK =====`);
        console.log(`✅ [${requestId}] All credentials found`);
        console.log(`✅ [${requestId}] Credentials validation duration: ${Date.now() - credentialsStartTime}ms`);

        // ========================================================================
        // CREDENCIAIS JÁ VALIDADAS E DESCRIPTOGRAFADAS - LOGS MÁXIMOS
        // ========================================================================
        
        console.log(`\n🔍🔍🔍 [${requestId}] ===== CREDENCIAIS PRONTAS =====`);
        const decryptStartTime = Date.now();
        
        // Usar credenciais já validadas do novo sistema
        const credentials = {
          apiKey: activeCredentials.credentials.apiKey,
          apiSecret: activeCredentials.credentials.apiSecret,
          passphrase: activeCredentials.credentials.passphrase,
        };
        
        console.log(`\n✅✅✅ [${requestId}] ===== CREDENCIAIS OK =====`);
        console.log(`✅ [${requestId}] All credentials ready from exchange accounts system`);
        console.log(`✅ [${requestId}] Credentials preparation duration: ${Date.now() - decryptStartTime}ms`);

        // ========================================================================
        // FASE 4: INICIALIZAÇÃO DO SERVIÇO LN MARKETS
        // ========================================================================
        
        const serviceStartTime = Date.now();
        const { LNMarketsAPIv2 } = await import('../services/lnmarkets/LNMarketsAPIv2.service');
        const { isTestnetCredentials } = await import('../utils/credentials.utils');
        
        const lnMarketsService = new LNMarketsAPIv2({
          credentials: {
            ...credentials,
            isTestnet: isTestnetCredentials(activeCredentials.credentials)
          },
          logger: logger
        });

        logger.info(`✅ [${requestId}] LN Markets service initialized (${Date.now() - serviceStartTime}ms)`);

        // ========================================================================
        // FASE 5: BUSCA ÚNICA DE TODOS OS DADOS (ESTRATÉGIA CORRETA)
        // ========================================================================
        
        const dataFetchStartTime = Date.now();
        logger.info(`🔍 [${requestId}] Starting single comprehensive data fetch...`);

        let allData;
        try {
          // Fazer UMA única requisição para obter TODOS os dados
          console.log(`🔍 [${requestId}] Calling getUser() to get all user data...`);
          allData = await lnMarketsService.getUser();
          
          logger.info(`✅ [${requestId}] All data fetched successfully (${Date.now() - dataFetchStartTime}ms)`);
          console.log(`📊 [${requestId}] Data structure:`, {
            type: typeof allData,
            isArray: Array.isArray(allData),
            length: Array.isArray(allData) ? allData.length : 'not array',
            keys: allData && typeof allData === 'object' ? Object.keys(allData) : 'not object'
          });
          
        } catch (apiError: any) {
          logger.warn(`⚠️ [${requestId}] API call failed: ${apiError.message}`);
          
          // FALLBACK: Se a API falhar, retornar dados estruturados vazios
          console.log(`🔄 [${requestId}] Using fallback empty data structure`);
          allData = {
            user: null,
            balance: null,
            positions: [],
            market: null,
            deposits: [],
            withdrawals: [],
            trades: [],
            orders: []
          };
        }

        // ========================================================================
        // FASE 6: PROCESSAMENTO E ESTRUTURAÇÃO DOS DADOS
        // ========================================================================
        
        const processingStartTime = Date.now();
        
        // Processar dados únicos da LN Markets
        const processedData = {
          // Dados do usuário da nossa plataforma
          user: {
            id: userId,
            email: userProfile.email,
            username: userProfile.username,
            plan_type: userProfile.plan_type,
          },
          
          // TODOS os dados da LN Markets em uma estrutura organizada
          lnMarkets: {
            // Dados completos retornados pela API
            rawData: allData,
            
            // Dados estruturados para fácil acesso
            user: allData?.user || allData?.profile || null,
            balance: allData?.balance || allData?.wallet || null,
            positions: allData?.positions || allData?.trades || [],
            market: allData?.market || allData?.ticker || null,
            deposits: allData?.deposits || allData?.transactions?.deposits || [],
            withdrawals: allData?.withdrawals || allData?.transactions?.withdrawals || [],
            orders: allData?.orders || allData?.openOrders || [],
            trades: allData?.trades || allData?.history || [],
            
            // Metadados adicionais
            metadata: {
              lastUpdate: new Date().toISOString(),
              dataSource: 'lnmarkets-api',
              version: '2.0.0'
            }
          },
          
          // Metadados de performance
          performance: {
            totalDuration: Date.now() - startTime,
            credentialsDuration: Date.now() - credentialsStartTime,
            decryptDuration: Date.now() - decryptStartTime,
            serviceDuration: Date.now() - serviceStartTime,
            dataFetchDuration: Date.now() - dataFetchStartTime,
            processingDuration: Date.now() - processingStartTime,
            apiCallDuration: Date.now() - dataFetchStartTime
          },
          
          // Status geral
          status: {
            apiConnected: allData ? true : false,
            dataAvailable: allData && Object.keys(allData).length > 0,
            lastSync: new Date().toISOString()
          }
        };

        logger.info(`📊 [${requestId}] Data processed successfully (${Date.now() - processingStartTime}ms)`);

        // ========================================================================
        // FASE 7: RESPOSTA OTIMIZADA
        // ========================================================================
        
        const response = {
          success: true,
          data: processedData,
          message: 'LN Markets dashboard data fetched successfully',
          requestId,
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        };

        logger.info(`🎉 [${requestId}] Request completed successfully in ${Date.now() - startTime}ms`);

        return reply.status(200).send(response);

      } catch (error: any) {
        const errorDuration = Date.now() - startTime;
        logger.error(`❌ [${requestId}] Request failed after ${errorDuration}ms:`, {
          message: error.message,
          stack: error.stack,
          userId: (request as any).user?.id
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
  // ENDPOINT ESPECÍFICO PARA POSIÇÕES (MANTIDO PARA COMPATIBILIDADE)
  // ============================================================================
  
  fastify.get('/positions', {
    preHandler: [(fastify as any).authenticate],
    handler: tradingController.getPositions.bind(tradingController)
  });

  // ============================================================================
  // TEST ROUTES (TEMPORARY)
  // ============================================================================
  
  // Test route to verify middleware
  fastify.get('/test/middleware', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      console.log('🔍 TEST ROUTE - Middleware test called');
      console.log('🔍 TEST ROUTE - request.user:', (request as any).user);
      return reply.send({
        success: true,
        message: 'Middleware test successful',
        user: (request as any).user
      });
    }
  });

  // Test route to verify simple response
  fastify.get('/test/simple', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        message: 'Simple test successful',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test route to verify simple database query
  fastify.get('/test/database', {
    preHandler: [(fastify as any).authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        console.log('🔍 TEST DATABASE - Called');
        
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        console.log('✅ TEST DATABASE - User ID found:', userId);

        // Simple database query
        const userProfile = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
          },
        });

        console.log('✅ TEST DATABASE - Database query successful');

        return reply.send({
          success: true,
          message: 'Database test successful',
          user: userProfile
        });

      } catch (error: any) {
        console.error('❌ TEST DATABASE - Error:', {
          message: error.message,
          stack: error.stack,
        });
        
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Database test failed',
        });
      }
    }
  });

  // Test route to verify positions without middleware
  fastify.get('/test/positions-direct', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      console.log('🔍 TEST POSITIONS DIRECT - Called');
      console.log('🔍 TEST POSITIONS DIRECT - request.user:', (request as any).user);
      console.log('🔍 TEST POSITIONS DIRECT - request.headers:', request.headers);
      
      // Get user ID from JWT token directly
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Authorization header with Bearer token is required',
        });
      }

      const token = authHeader.substring(7);
      
      // Validate token and get user ID
      const { AuthService } = await import('../services/auth.service');
      const authService = new AuthService(prisma, request.server);
      const user = await authService.validateSession(token);
      
      if (!user?.id) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Invalid token or user not found',
        });
      }
      
      return reply.send({
        success: true,
        message: 'Direct positions test successful',
        user: user
      });
    }
  });

  // ============================================================================
  // PUBLIC ROUTES (NO AUTHENTICATION REQUIRED)
  // ============================================================================
  
  // Public market ticker (no authentication required)
  fastify.get('/public/ticker', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Use market controller but without authentication
        const tickerData = await marketController.getTicker(request, reply);
        return tickerData;
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to get market ticker',
        });
      }
    }
  });

  // Public market status (no authentication required)
  fastify.get('/public/status', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Use market controller but without authentication
        const statusData = await marketController.getSystemStatus(request, reply);
        return statusData;
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Failed to get system status',
        });
      }
    }
  });
}

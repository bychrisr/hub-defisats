import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '@/services/lnmarkets-api.service';

export class LNMarketsUserController {
  constructor(private prisma: PrismaClient) {}

  private async getLNMarketsService(userId: string): Promise<LNMarketsAPIService> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ln_markets_api_key: true, ln_markets_api_secret: true, ln_markets_passphrase: true }
    });

    if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret || !user?.ln_markets_passphrase) {
      throw new Error('LN Markets credentials not configured');
    }

    // Decrypt credentials
    const { AuthService } = await import('../services/auth.service');
    const authService = new AuthService(this.prisma, {} as any);
    const apiKey = authService.decryptData(user.ln_markets_api_key);
    const apiSecret = authService.decryptData(user.ln_markets_api_secret);
    const passphrase = authService.decryptData(user.ln_markets_passphrase);

    return new LNMarketsAPIService({
      apiKey,
      apiSecret,
      passphrase,
      isTestnet: false // Force mainnet for now
    });
  }

  async getUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.getUser();
      
      console.log(`[UserController] User data retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user data',
        details: error.message
      });
    }
  }

  async getUserBalance(request: FastifyRequest, reply: FastifyReply) {
    console.log('🔍 USER CONTROLLER - getUserBalance called');
    try {
      const userId = (request as any).user?.id;
      console.log('🔍 USER CONTROLLER - userId:', userId);
      if (!userId) {
        console.log('❌ USER CONTROLLER - No userId found');
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      console.log('🔍 USER CONTROLLER - Getting LN Markets service...');
      const lnmarkets = await this.getLNMarketsService(userId);
      console.log('✅ USER CONTROLLER - LN Markets service obtained');
      
      console.log('🔍 USER CONTROLLER - Calling getUserBalance...');
      const result = await lnmarkets.getUserBalance();
      console.log('✅ USER CONTROLLER - getUserBalance completed');
      
      console.log(`✅ [UserController] User balance retrieved for user ${userId}:`, JSON.stringify(result, null, 2));

      // Create a clean object to ensure proper serialization
      const cleanBalance = {
        balance: result.balance || 0,
        synthetic_usd_balance: result.synthetic_usd_balance || 0,
        uid: result.uid || userId,
        role: result.role || 'user',
        username: result.username || 'user',
        login: result.login || result.username || 'user',
        linking_public_key: result.linkingpublickey || result.linking_public_key || null,
        show_leaderboard: result.show_leaderboard || false,
        email: result.email || null,
        email_confirmed: result.email_confirmed || false,
        account_type: result.account_type || 'credentials',
        fee_tier: result.fee_tier || 0
      };

      console.log(`🔍 [UserController] Clean balance object:`, JSON.stringify(cleanBalance, null, 2));

      return reply.send({
        success: true,
        data: cleanBalance
      });
    } catch (error: any) {
      console.error('❌ [UserController] Error getting user balance:', error);
      console.error('❌ [UserController] Error details:', {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Sempre retornar saldo padrão quando há erro (API keys inválidas ou outros problemas)
      const userId = (request as any).user?.id;
      console.log(`⚠️ [UserController] Returning default balance for user ${userId} due to error`);
      return reply.send({
        success: true,
        data: {
          balance: 0,
          synthetic_usd_balance: 0,
          uid: userId,
          role: 'user',
          username: 'user',
          linking_public_key: null,
          show_leaderboard: false,
          email: null
        }
      });
    }
  }

  async getEstimatedBalance(request: FastifyRequest, reply: FastifyReply) {
    console.log('🔍 USER CONTROLLER - getEstimatedBalance called');
    try {
      const userId = (request as any).user?.id;
      console.log('🔍 USER CONTROLLER - userId:', userId);
      if (!userId) {
        console.log('❌ USER CONTROLLER - No userId found');
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      console.log('🔍 USER CONTROLLER - Getting LN Markets service...');
      const lnmarkets = await this.getLNMarketsService(userId);
      
      // 1. Buscar saldo da wallet
      console.log('🔍 USER CONTROLLER - Fetching wallet balance...');
      const balanceResult = await lnmarkets.getUserBalance();
      const walletBalance = balanceResult.balance || 0;
      console.log('✅ USER CONTROLLER - Wallet balance:', walletBalance);
      
      // 2. Buscar posições abertas
      console.log('🔍 USER CONTROLLER - Fetching open positions...');
      const positions = await lnmarkets.getUserPositions();
      console.log('✅ USER CONTROLLER - Positions found:', Array.isArray(positions) ? positions.length : 0);
      
      // 3. Buscar histórico de trades (abertas + fechadas) para calcular Total Investido
      console.log('🔍 USER CONTROLLER - Fetching ALL trades (running + closed) for Total Investido...');
      let allTrades: any[] = [];
      try {
        allTrades = await lnmarkets.getAllUserTrades(1000); // Buscar até 1000 trades (running + closed)
        console.log('✅ USER CONTROLLER - All trades found:', Array.isArray(allTrades) ? allTrades.length : 0);
        console.log('📊 USER CONTROLLER - Sample trade data:', Array.isArray(allTrades) && allTrades.length > 0 ? allTrades[0] : 'No trades');
      } catch (error) {
        console.log('⚠️ USER CONTROLLER - Could not fetch trades, using positions only for Total Investido');
        console.log('⚠️ USER CONTROLLER - Error details:', {
          message: (error as Error).message,
          status: (error as any).response?.status,
          statusText: (error as any).response?.statusText
        });
        allTrades = [];
      }
      
      let totalMargin = 0;
      let totalPnL = 0;
      let totalFees = 0;
      let totalInvested = 0; // Total investido = margem inicial de TODAS as posições
      
      if (Array.isArray(positions)) {
        for (const position of positions) {
          // Margem inicial (entry_margin ou margin)
          const margin = position.entry_margin || position.margin || 0;
          totalMargin += margin;
          
          // PnL atual
          const pnl = position.pl || 0;
          totalPnL += pnl;
          
          // Taxas (opening_fee + closing_fee + sum_carry_fees)
          const openingFee = position.opening_fee || 0;
          const closingFee = position.closing_fee || 0;
          const carryFees = position.sum_carry_fees || 0;
          totalFees += (openingFee + closingFee + carryFees);
          
          console.log(`🔍 Position ${position.id}:`, {
            margin,
            pnl,
            fees: openingFee + closingFee + carryFees
          });
        }
      }
      
      // 4. Calcular Total Investido 
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        // Se conseguiu buscar trades históricos, usar todos
        for (const trade of allTrades) {
          const tradeMargin = trade.entry_margin || trade.margin || 0;
          totalInvested += tradeMargin;
          
          console.log(`🔍 Trade ${trade.id}:`, {
            status: trade.status,
            margin: tradeMargin,
            side: trade.side,
            quantity: trade.quantity
          });
        }
      } else {
        // Se não conseguiu buscar trades, usar apenas posições abertas como base
        console.log('⚠️ USER CONTROLLER - Using open positions as proxy for Total Investido');
        totalInvested = totalMargin; // Usar margem das posições abertas como estimativa
      }
      
      console.log('📊 Total Investido Calculation:', {
        totalTradesAnalyzed: Array.isArray(allTrades) ? allTrades.length : 0,
        totalInvested
      });
      
      // 5. Calcular Saldo Estimado
      // Fórmula: saldo da wallet + margem inicial + profit estimado - taxas a pagar
      const estimatedBalance = walletBalance + totalMargin + totalPnL - totalFees;
      
      console.log('📊 Estimated Balance Calculation:', {
        walletBalance,
        totalMargin,
        totalPnL,
        totalFees,
        estimatedBalance
      });
      
      const result = {
        wallet_balance: walletBalance,
        total_margin: totalMargin,
        total_pnl: totalPnL,
        total_fees: totalFees,
        estimated_balance: estimatedBalance,
        total_invested: totalInvested, // Margem inicial de TODAS as posições (abertas + fechadas)
        positions_count: Array.isArray(positions) ? positions.length : 0,
        trades_count: Array.isArray(allTrades) ? allTrades.length : 0
      };

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('❌ [UserController] Error getting estimated balance:', error);
      console.error('❌ [UserController] Error details:', {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });

      // Return empty/default data instead of 500 error to avoid breaking the UI
      const userId = (request as any).user?.id;
      console.log(`⚠️ [UserController] Returning default estimated balance for user ${userId} due to error`);

      return reply.send({
        success: true,
        data: {
          wallet_balance: 0,
          total_margin: 0,
          total_pnl: 0,
          total_fees: 0,
          estimated_balance: 0,
          total_invested: 0,
          positions_count: 0,
          trades_count: 0
        },
        message: 'Unable to calculate estimated balance. Please check your API credentials.',
        error: 'CALCULATION_FAILED'
      });
    }
  }

  async getUserHistory(
    request: FastifyRequest<{ Querystring: {
      limit?: string;
      offset?: string;
      type?: string;
    } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const { limit, offset, type } = request.query;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const params: any = {};
      if (limit) params.limit = parseInt(limit);
      if (offset) params.offset = parseInt(offset);
      if (type) params.type = type;

      const result = await lnmarkets.getUserHistory(params);
      
      console.log(`[UserController] User history retrieved for user ${userId}`, {
        userId,
        params,
        count: Array.isArray(result) ? result.length : 'unknown'
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user history:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user history',
        details: error.message
      });
    }
  }

  async getUserTrades(
    request: FastifyRequest<{ Querystring: {
      limit?: string;
      offset?: string;
      status?: string;
      type?: string;
    } }>,
    reply: FastifyReply
  ) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const { limit, offset, status, type } = request.query;
      const lnmarkets = await this.getLNMarketsService(userId);
      
      const params: any = {};
      if (limit) params.limit = parseInt(limit);
      if (offset) params.offset = parseInt(offset);
      if (status) params.status = status;
      if (type) params.type = type;
      
      // Se não foi especificado um tipo, usar 'closed' como padrão para trades
      if (!params.type) {
        params.type = 'closed';
      }

      const result = await lnmarkets.getUserTrades(params);

      console.log(`[UserController] User trades retrieved for user ${userId}`, {
        userId,
        params,
        count: Array.isArray(result) ? result.length : 'unknown',
        result: result
      });

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user trades:', error);

      // Return empty data instead of simulated data to avoid misleading users
      console.log('[UserController] API call failed, returning empty trades data');

      return reply.send({
        success: true,
        data: [], // Empty array instead of simulated data
        message: 'Unable to retrieve trades data. Please check your connection and credentials.',
        error: 'API_UNAVAILABLE'
      });
    }
  }

  async getUserPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      // Check if user has LN Markets credentials
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { ln_markets_api_key: true, ln_markets_api_secret: true, ln_markets_passphrase: true }
      });

      if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret || !user?.ln_markets_passphrase) {
        console.log(`[UserController] User ${userId} has no LN Markets credentials configured`);

        // Return null/empty data instead of demo data to avoid misleading users
        return reply.send({
          success: true,
          data: [], // Empty array instead of demo data
          message: 'LN Markets credentials not configured. Please configure your API credentials in settings.'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.getUserPositions();
      
      console.log(`[UserController] User positions retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user positions:', error);
      console.error('[UserController] Error details:', {
        message: error.message,
        status: error.status,
        response: error.response?.data
      });
      
      // If it's a credentials error, return demo positions instead of 500
      console.log(`[UserController] Checking error conditions:`, {
        status: error.status,
        message: error.message,
        responseMessage: error.response?.data?.message,
        condition1: error.status === 401,
        condition2: error.response?.data?.message?.includes('Api key does not exist')
      });
      
      if (error.status === 401 || error.response?.data?.message?.includes('Api key does not exist')) {
        console.log(`[UserController] Invalid LN Markets credentials for user ${(request as any).user?.id}:`, error.message);

        // Return empty data instead of demo data to avoid misleading users
        return reply.send({
          success: true,
          data: [], // Empty array instead of demo data
          message: 'LN Markets credentials are invalid. Please check your API credentials in settings.',
          error: 'INVALID_CREDENTIALS'
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user positions',
        details: error.message
      });
    }
  }

  async getUserOrders(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const lnmarkets = await this.getLNMarketsService(userId);
      const result = await lnmarkets.getUserOrders();
      
      console.log(`[UserController] User orders retrieved for user ${userId}`);

      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[UserController] Error getting user orders:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user orders',
        details: error.message
      });
    }
  }
}

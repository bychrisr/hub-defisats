import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

export class LNMarketsUserController {
  constructor(private prisma: PrismaClient) {}

  // Get fee rate from tier
  private getFeeRateFromTier(feeTier: number): number {
    const tiers: { [key: number]: number } = {
      0: 0.001,  // 0.1%
      1: 0.0008, // 0.08%
      2: 0.0007, // 0.07%
      3: 0.0006  // 0.06%
    };
    return tiers[feeTier] || 0.001; // Default to tier 0
  }

  private async checkIfAdmin(userId: string): Promise<boolean> {
    const adminUser = await this.prisma.adminUser.findFirst({
      where: { user_id: userId }
    });
    return !!adminUser;
  }

  private async getLNMarketsService(userId: string): Promise<LNMarketsAPIService> {
    console.log(`🔍 GET LN MARKETS SERVICE - Starting for user: ${userId}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ln_markets_api_key: true, ln_markets_api_secret: true, ln_markets_passphrase: true }
    });

    console.log(`🔍 GET LN MARKETS SERVICE - User found:`, {
      hasApiKey: !!user?.ln_markets_api_key,
      hasApiSecret: !!user?.ln_markets_api_secret,
      hasPassphrase: !!user?.ln_markets_passphrase
    });

    if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret || !user?.ln_markets_passphrase) {
      throw new Error('LN Markets credentials not configured');
    }

    try {
      // Decrypt credentials
      const { AuthService } = await import('../services/auth.service');
      const authService = new AuthService(this.prisma, {} as any);
      
      console.log(`🔍 GET LN MARKETS SERVICE - Decrypting credentials...`);
      console.log(`🔍 GET LN MARKETS SERVICE - Encrypted data lengths:`, {
        apiKeyLength: user.ln_markets_api_key?.length || 0,
        apiSecretLength: user.ln_markets_api_secret?.length || 0,
        passphraseLength: user.ln_markets_passphrase?.length || 0
      });
      
      let apiKey, apiSecret, passphrase;
      
      try {
        apiKey = authService.decryptData(user.ln_markets_api_key);
        console.log(`✅ GET LN MARKETS SERVICE - API Key decrypted successfully`);
      } catch (error: any) {
        console.error(`❌ GET LN MARKETS SERVICE - Error decrypting API Key:`, error?.message);
        throw error;
      }
      
      try {
        apiSecret = authService.decryptData(user.ln_markets_api_secret);
        console.log(`✅ GET LN MARKETS SERVICE - API Secret decrypted successfully`);
      } catch (error: any) {
        console.error(`❌ GET LN MARKETS SERVICE - Error decrypting API Secret:`, error?.message);
        throw error;
      }
      
      try {
        passphrase = authService.decryptData(user.ln_markets_passphrase);
        console.log(`✅ GET LN MARKETS SERVICE - Passphrase decrypted successfully`);
      } catch (error: any) {
        console.error(`❌ GET LN MARKETS SERVICE - Error decrypting Passphrase:`, error?.message);
        throw error;
      }

      console.log(`🔍 GET LN MARKETS SERVICE - Credentials decrypted successfully:`, {
        apiKeyLength: apiKey?.length || 0,
        apiSecretLength: apiSecret?.length || 0,
        passphraseLength: passphrase?.length || 0
      });

      // Create a logger for the LNMarketsAPIService
      const logger = {
        info: (message: string, meta?: any) => console.log(`[LNMarketsAPI] ${message}`, meta || ''),
        error: (message: string, meta?: any) => console.error(`[LNMarketsAPI] ${message}`, meta || ''),
        warn: (message: string, meta?: any) => console.warn(`[LNMarketsAPI] ${message}`, meta || ''),
        debug: (message: string, meta?: any) => console.debug(`[LNMarketsAPI] ${message}`, meta || '')
      };

      return new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false // Force mainnet for now
      }, logger);
    } catch (error: any) {
      console.error(`❌ GET LN MARKETS SERVICE - Error decrypting credentials:`, {
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
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

      // Verificar se o usuário é admin
      if (await this.checkIfAdmin(userId)) {
        console.log('🔍 USER CONTROLLER - Admin user, returning admin user data...');
        return reply.send({
          success: true,
          data: {
            uid: userId,
            username: 'admin',
            email: 'admin@dev.com',
            role: 'admin'
          }
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

      // Verificar se o usuário é admin
      if (await this.checkIfAdmin(userId)) {
        console.log('🔍 USER CONTROLLER - Admin user, returning empty balance...');
        return reply.send({
          success: true,
          data: {
            balance: 0,
            synthetic_usd_balance: 0,
            uid: userId,
            role: 'admin',
            username: 'admin',
            linking_public_key: null,
            show_leaderboard: false,
            email: null
          }
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
        total_balance: result.balance || 0,
        available_balance: result.balance || 0, // Para LN Markets, o balance é o saldo disponível
        margin_used: 0, // Será calculado baseado nas posições
        balance: result.balance || 0, // Manter compatibilidade
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
    console.log('🔍 USER CONTROLLER - Request headers:', request.headers);
    console.log('🔍 USER CONTROLLER - Request method:', request.method);
    console.log('🔍 USER CONTROLLER - Request url:', request.url);
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

      // Verificar se o usuário é admin
      if (await this.checkIfAdmin(userId)) {
        console.log('🔍 USER CONTROLLER - Admin user, returning empty estimated balance...');
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
            trades_count: 0,
            // Novos campos com valores padrão para admin
            success_rate: 0,
            winning_trades: 0,
            lost_trades: 0,
            total_trades: 0,
            active_positions: 0,
            average_pnl: 0,
            win_rate: 0,
            max_drawdown: 0,
            sharpe_ratio: 0,
            volatility: 0,
            // 4 novas métricas
            win_streak: 0,
            best_trade: 0,
            risk_reward_ratio: 0,
            trading_frequency: 0
          }
        });
      }

      console.log('🔍 USER CONTROLLER - Getting LN Markets service...');
      const lnmarkets = await this.getLNMarketsService(userId);
      
      // 1. Buscar saldo da wallet
      console.log('🔍 USER CONTROLLER - Fetching wallet balance...');
      const balanceResult = await lnmarkets.getUserBalance();
      const walletBalance = balanceResult.balance || 0;
      console.log('✅ USER CONTROLLER - Wallet balance:', walletBalance);
      
      // 2. Buscar dados do ticker (funding rate, index price, last price)
      console.log('🔍 USER CONTROLLER - Fetching ticker data...');
      const tickerData = await lnmarkets.getFuturesTicker();
      const fundingRate = tickerData.carryFeeRate || 0;
      const indexPrice = tickerData.index || 0;
      const lastPrice = tickerData.lastPrice || 0;
      console.log('✅ USER CONTROLLER - Ticker data:', { fundingRate, indexPrice, lastPrice });
      
      // 3. Buscar posições abertas
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
        console.log('🔍 USER CONTROLLER - Processing positions for margin calculation...');
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
            fees: openingFee + closingFee + carryFees,
            entry_margin: position.entry_margin,
            margin_field: position.margin,
            status: position.status
          });
        }
        console.log('✅ USER CONTROLLER - Total margin calculated from positions:', totalMargin);
      } else {
        console.log('⚠️ USER CONTROLLER - No positions array or positions is not an array:', positions);
      }
      
      // 4. Calcular Total Investido - Soma de todas as margens iniciais (abertas + fechadas)
      console.log('🔍 USER CONTROLLER - Calculating Total Investido...');
      console.log('🔍 USER CONTROLLER - Positions data:', {
        isArray: Array.isArray(positions),
        length: Array.isArray(positions) ? positions.length : 0,
        sample: Array.isArray(positions) && positions.length > 0 ? positions[0] : null
      });
      
      // Primeiro, somar margens das posições abertas
      if (Array.isArray(positions) && positions.length > 0) {
        for (const position of positions) {
          const margin = position.entry_margin || position.margin || 0;
          totalInvested += margin;
          console.log(`🔍 Open Position ${position.id}: margin = ${margin} (entry_margin: ${position.entry_margin}, margin: ${position.margin})`);
        }
      } else {
        console.log('⚠️ USER CONTROLLER - No open positions found for Total Investido calculation');
      }
      
      // Depois, somar margens das posições fechadas (trades)
      console.log('🔍 USER CONTROLLER - All trades data:', {
        isArray: Array.isArray(allTrades),
        length: Array.isArray(allTrades) ? allTrades.length : 0,
        sample: Array.isArray(allTrades) && allTrades.length > 0 ? allTrades[0] : null
      });
      
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        let closedTradesCount = 0;
        for (const trade of allTrades) {
          // Só somar se NÃO for uma posição running (ou seja, todas as fechadas)
          if (trade.status !== 'running') {
            const margin = trade.entry_margin || trade.margin || 0;
            totalInvested += margin;
            closedTradesCount++;
            console.log(`🔍 Closed Trade ${trade.id} (status: ${trade.status}): margin = ${margin} (entry_margin: ${trade.entry_margin}, margin: ${trade.margin})`);
          }
        }
        console.log(`✅ USER CONTROLLER - Processed ${closedTradesCount} closed trades for Total Investido`);
      } else {
        console.log('⚠️ USER CONTROLLER - No closed trades found for Total Investido calculation');
      }
      
      console.log('✅ USER CONTROLLER - Total Investido calculated:', totalInvested);
      
      console.log('📊 Total Investido Final:', {
        openPositions: Array.isArray(positions) ? positions.length : 0,
        closedTrades: Array.isArray(allTrades) ? allTrades.filter(t => t.status !== 'running').length : 0,
        totalInvested
      });
      
      // 5. Calcular Saldo Estimado usando a fórmula da documentação
      // Fórmula: saldo_disponivel_atual + soma_dos_saldos_estimados_das_posicoes_running - soma_das_taxas_estimadas_para_fechamento_das_posicoes - soma_das_taxas_de_funding_estimadas_para_as_proximas_24h
      
      let somaSaldosPosicoes = 0;
      let somaTaxasFechamento = 0;
      let somaFunding24h = 0;
      
      // Obter fee_tier do usuário
      const feeTier = balanceResult.fee_tier || 0;
      const feeRate = this.getFeeRateFromTier(feeTier);
      
      console.log('🔍 USER CONTROLLER - Fee calculation:', { feeTier, feeRate });
      
      if (Array.isArray(positions)) {
        for (const position of positions) {
          // 1. Saldo estimado da posição (antes de taxas)
          // margin + pl + maintenance_margin
          const margin = position.entry_margin || position.margin || 0;
          const pl = position.pl || 0;
          const maintenanceMargin = position.maintenance_margin || 0;
          const saldoPosicao = margin + pl + maintenanceMargin;
          somaSaldosPosicoes += saldoPosicao;
          
          // 2. Taxa de fechamento estimada
          // (quantity / lastPrice) * fee_rate * 100_000_000
          const quantity = position.quantity || 0;
          if (quantity > 0 && lastPrice > 0) {
            const taxaFechamento = (quantity / lastPrice) * feeRate * 100_000_000;
            somaTaxasFechamento += Math.round(taxaFechamento);
          }
          
          // 3. Funding estimado para 24h (3 eventos)
          // (quantity / indexPrice) * funding_rate * 100_000_000 * 3
          let funding24h = 0;
          if (quantity > 0 && indexPrice > 0) {
            const fundingPorEvento = (quantity / indexPrice) * fundingRate * 100_000_000;
            
            if (position.side === 'b') { // Long
              funding24h = fundingRate > 0 ? 3 * Math.abs(fundingPorEvento) : 3 * (-Math.abs(fundingPorEvento));
            } else { // Short
              funding24h = fundingRate > 0 ? 3 * (-Math.abs(fundingPorEvento)) : 3 * Math.abs(fundingPorEvento);
            }
            
            somaFunding24h += Math.round(funding24h);
          }
          
          console.log('🔍 USER CONTROLLER - Position calculation:', {
            id: position.id,
            side: position.side,
            quantity,
            margin,
            pl,
            maintenanceMargin,
            saldoPosicao,
            taxaFechamento: quantity > 0 && lastPrice > 0 ? Math.round((quantity / lastPrice) * feeRate * 100_000_000) : 0,
            funding24h: Math.round(funding24h)
          });
        }
      }
      
      const estimatedBalance = walletBalance + somaSaldosPosicoes - somaTaxasFechamento - somaFunding24h;
      
      console.log('📊 Estimated Balance Calculation (New Formula):', {
        walletBalance,
        somaSaldosPosicoes,
        somaTaxasFechamento,
        somaFunding24h,
        estimatedBalance,
        feeTier,
        feeRate,
        fundingRate,
        indexPrice,
        lastPrice
      });
      
      // 6. Calcular métricas adicionais para os novos cards
      console.log('🔍 USER CONTROLLER - Calculating additional metrics...');
      
      // Success Rate - Taxa de sucesso dos trades fechados
      let successRate = 0;
      let winningTrades = 0;
      let lostTrades = 0;
      let totalTrades = 0;
      
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        totalTrades = allTrades.length;
        
        if (closedTrades.length > 0) {
          winningTrades = closedTrades.filter(trade => (trade.pnl || trade.pl || 0) > 0).length;
          lostTrades = closedTrades.filter(trade => (trade.pnl || trade.pl || 0) < 0).length;
          successRate = (winningTrades / closedTrades.length) * 100;
        }
        
        console.log('📊 Success Rate Calculation:', {
          totalTrades,
          closedTrades: closedTrades.length,
          winningTrades,
          lostTrades,
          successRate: successRate.toFixed(2)
        });
      }
      
      // Active Positions - Posições ativas (running)
      const activePositions = Array.isArray(positions) ? positions.filter(pos => pos.status === 'running').length : 0;
      
      // Average PnL - PnL médio por trade fechado
      let averagePnL = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        if (closedTrades.length > 0) {
          const totalPnLClosed = closedTrades.reduce((sum, trade) => sum + (trade.pnl || trade.pl || 0), 0);
          averagePnL = totalPnLClosed / closedTrades.length;
        }
      }
      
      // Win Rate - Taxa de trades vencedores (mesmo que success rate)
      const winRate = successRate;
      
      // Max Drawdown - Maior perda consecutiva (simplificado)
      let maxDrawdown = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        if (closedTrades.length > 0) {
          let currentDrawdown = 0;
          let maxDrawdownSoFar = 0;
          
          for (const trade of closedTrades) {
            const pnl = trade.pnl || trade.pl || 0;
            if (pnl < 0) {
              currentDrawdown += Math.abs(pnl);
              maxDrawdownSoFar = Math.max(maxDrawdownSoFar, currentDrawdown);
            } else {
              currentDrawdown = 0;
            }
          }
          
          maxDrawdown = maxDrawdownSoFar;
        }
      }
      
      // Sharpe Ratio - Índice de Sharpe (simplificado)
      let sharpeRatio = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        if (closedTrades.length > 1) {
          const pnls = closedTrades.map(trade => trade.pnl || trade.pl || 0);
          const mean = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length;
          const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) / pnls.length;
          const stdDev = Math.sqrt(variance);
          
          if (stdDev > 0) {
            sharpeRatio = mean / stdDev;
          }
        }
      }
      
      // Volatility - Volatilidade das posições (simplificada)
      let volatility = 0;
      if (Array.isArray(positions) && positions.length > 0) {
        const pnls = positions.map(pos => pos.pl || 0);
        if (pnls.length > 1) {
          const mean = pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length;
          const variance = pnls.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) / pnls.length;
          volatility = Math.sqrt(variance);
        }
      }
      
      // 7. Calcular as 4 novas métricas para os cards adicionais
      console.log('🔍 USER CONTROLLER - Calculating 4 new metrics...');
      
      // Win Streak - Sequência de vitórias consecutivas mais recentes
      let winStreak = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        // Ordenar por data de fechamento (mais recente primeiro)
        const sortedTrades = closedTrades.sort((a, b) => {
          const dateA = new Date(a.closing_date || a.created_at || 0);
          const dateB = new Date(b.closing_date || b.created_at || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Contar vitórias consecutivas a partir do mais recente
        for (const trade of sortedTrades) {
          const pnl = trade.pnl || trade.pl || 0;
          if (pnl > 0) {
            winStreak++;
          } else {
            break; // Para na primeira derrota
          }
        }
      }
      
      // Best Trade - Maior lucro em um único trade
      let bestTrade = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        if (closedTrades.length > 0) {
          const maxPnL = Math.max(...closedTrades.map(trade => trade.pnl || trade.pl || 0));
          bestTrade = Math.max(0, maxPnL); // Só considerar lucros positivos
        }
      }
      
      // Risk/Reward Ratio - Relação risco/retorno
      let riskRewardRatio = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const closedTrades = allTrades.filter(trade => trade.status !== 'running');
        if (closedTrades.length > 0) {
          const pnls = closedTrades.map(trade => trade.pnl || trade.pl || 0);
          const positivePnls = pnls.filter(pnl => pnl > 0);
          const negativePnls = pnls.filter(pnl => pnl < 0);
          
          if (positivePnls.length > 0 && negativePnls.length > 0) {
            const avgGain = positivePnls.reduce((sum, pnl) => sum + pnl, 0) / positivePnls.length;
            const avgLoss = Math.abs(negativePnls.reduce((sum, pnl) => sum + pnl, 0) / negativePnls.length);
            riskRewardRatio = avgGain / avgLoss;
          }
        }
      }
      
      // Trading Frequency - Frequência de trading (trades por dia nos últimos 30 dias)
      let tradingFrequency = 0;
      if (Array.isArray(allTrades) && allTrades.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentTrades = allTrades.filter(trade => {
          const tradeDate = new Date(trade.created_at || trade.opening_date || 0);
          return tradeDate >= thirtyDaysAgo;
        });
        
        tradingFrequency = recentTrades.length / 30; // Trades por dia
      }
      
      console.log('📊 Additional Metrics Calculated:', {
        successRate: successRate.toFixed(2),
        winningTrades,
        lostTrades,
        totalTrades,
        activePositions,
        averagePnL: averagePnL.toFixed(2),
        winRate: winRate.toFixed(2),
        maxDrawdown: maxDrawdown.toFixed(2),
        sharpeRatio: sharpeRatio.toFixed(2),
        volatility: volatility.toFixed(2),
        // Novas métricas
        winStreak,
        bestTrade: bestTrade.toFixed(2),
        riskRewardRatio: riskRewardRatio.toFixed(2),
        tradingFrequency: tradingFrequency.toFixed(2)
      });

      const result = {
        wallet_balance: walletBalance,
        total_margin: totalMargin,
        total_pnl: totalPnL,
        total_fees: totalFees,
        estimated_balance: estimatedBalance,
        total_invested: totalInvested, // Margem inicial de TODAS as posições (abertas + fechadas)
        positions_count: Array.isArray(positions) ? positions.length : 0,
        trades_count: Array.isArray(allTrades) ? allTrades.length : 0,
        // Novos campos para os cards adicionais
        success_rate: successRate,
        winning_trades: winningTrades,
        lost_trades: lostTrades,
        total_trades: totalTrades,
        active_positions: activePositions,
        average_pnl: averagePnL,
        win_rate: winRate,
        max_drawdown: maxDrawdown,
        sharpe_ratio: sharpeRatio,
        volatility: volatility,
        // 4 novas métricas
        win_streak: winStreak,
        best_trade: bestTrade,
        risk_reward_ratio: riskRewardRatio,
        trading_frequency: tradingFrequency
      };

      console.log('✅ USER CONTROLLER - Estimated balance calculated successfully');
      console.log('📊 USER CONTROLLER - Final response data:', {
        wallet_balance: walletBalance,
        total_margin: totalMargin,
        total_pnl: totalPnL,
        total_fees: totalFees,
        estimated_balance: estimatedBalance,
        total_invested: totalInvested,
        positions_count: Array.isArray(positions) ? positions.length : 0,
        trades_count: Array.isArray(allTrades) ? allTrades.length : 0,
        debug: {
          allTradesLength: Array.isArray(allTrades) ? allTrades.length : 'Not an array',
          totalMarginFromPositions: totalMargin,
          totalInvestedCalculation: totalInvested,
          walletBalanceValue: walletBalance,
          hasTrades: Array.isArray(allTrades) && allTrades.length > 0,
          hasPositions: Array.isArray(positions) && positions.length > 0
        }
      });

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
          trades_count: 0,
          // Novos campos com valores padrão
          success_rate: 0,
          winning_trades: 0,
          lost_trades: 0,
          total_trades: 0,
          active_positions: 0,
          average_pnl: 0,
          win_rate: 0,
          max_drawdown: 0,
          sharpe_ratio: 0,
          volatility: 0,
          // 4 novas métricas
          win_streak: 0,
          best_trade: 0,
          risk_reward_ratio: 0,
          trading_frequency: 0
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

      // Verificar se o usuário é admin
      if (await this.checkIfAdmin(userId)) {
        console.log('🔍 USER CONTROLLER - Admin user, returning empty positions...');
        return reply.send({
          success: true,
          data: [],
          message: 'Admin user - no trading positions'
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

      // Check if credentials are placeholders
      try {
        const { AuthService } = await import('../services/auth.service');
        const authService = new AuthService(this.prisma, {} as any);
        
        const decryptedApiKey = authService.decryptData(user.ln_markets_api_key);
        const decryptedApiSecret = authService.decryptData(user.ln_markets_api_secret);
        
        if (decryptedApiKey === 'your_api_key_here' || decryptedApiSecret === 'your_api_secret_here') {
          console.log(`[UserController] User ${userId} has placeholder LN Markets credentials`);
          
          return reply.send({
            success: true,
            data: [], // Empty array
            message: 'LN Markets credentials are not configured. Please update your API credentials in settings with real LN Markets API key, secret, and passphrase.'
          });
        }
      } catch (decryptError) {
        console.log(`[UserController] Error decrypting credentials for user ${userId}:`, decryptError);
        // Continue with normal flow if decryption fails
      }

      try {
        const lnmarkets = await this.getLNMarketsService(userId);
        const result = await lnmarkets.getUserPositions();
        
        console.log(`[UserController] User positions retrieved for user ${userId}`);

        return reply.send({
          success: true,
          data: result
        });
      } catch (lnmarketsError: any) {
        console.error(`[UserController] Error with LN Markets service for user ${userId}:`, lnmarketsError);
        
        // Check if it's a decryption error
        if (lnmarketsError.message?.includes('bad decrypt')) {
          return reply.send({
            success: true,
            data: [],
            message: 'LN Markets credentials are corrupted or encrypted with a different key. Please reconfigure your API credentials in settings.'
          });
        }
        
        // Re-throw other errors to be handled by the outer catch
        throw lnmarketsError;
      }
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
        responseMessage: error.response?.data?.message || 'No response message',
        condition1: error.status === 401,
        condition2: error.response?.data?.message?.includes('Api key does not exist') || false
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

      // Verificar se o usuário é admin
      if (await this.checkIfAdmin(userId)) {
        console.log('🔍 USER CONTROLLER - Admin user, returning empty orders...');
        return reply.send({
          success: true,
          data: [],
          message: 'Admin user - no trading orders'
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

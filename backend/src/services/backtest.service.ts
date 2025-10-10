import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';

const prisma = new PrismaClient();

export interface BacktestConfig {
  userId: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  automationType: 'margin_guard' | 'tp_sl' | 'auto_entry';
  automationConfig: any;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  performance: BacktestPerformance[];
}

export interface BacktestTrade {
  id: string;
  entryTime: Date;
  exitTime: Date;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercentage: number;
  automationAction?: string;
}

export interface BacktestPerformance {
  date: Date;
  balance: number;
  pnl: number;
  drawdown: number;
}

export class BacktestService {
  /**
   * Execute a personal backtest based on user's historical trades
   */
  async executePersonalBacktest(config: BacktestConfig): Promise<BacktestResult> {
    console.log(`📊 Executing personal backtest for user ${config.userId}`);

    // Get user's credentials
    const user = await prisma.user.findUnique({
      where: { id: config.userId },
      select: {
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true,
      },
    });

    if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret) {
      throw new Error('LN Markets credentials not found');
    }

    // Create LN Markets service
    const lnMarkets = new LNMarketsAPIv2({
      credentials: {
        apiKey: user.ln_markets_api_key,
        apiSecret: user.ln_markets_api_secret,
        passphrase: user.ln_markets_passphrase || '',
        isTestnet: false
      },
      logger: console as any
    });

    // Get historical trades
    const historicalTrades = await lnMarkets.futures.getClosedTrades(config.startDate, config.endDate);

    if (historicalTrades.length === 0) {
      throw new Error('No historical trades found for the specified period');
    }

    console.log(`📈 Found ${historicalTrades.length} historical trades for backtest`);

    // Simulate automation on historical data
    const simulatedTrades = await this.simulateAutomation(
      historicalTrades,
      config.automationType,
      config.automationConfig,
      config.initialBalance
    );

    // Calculate performance metrics
    const result = this.calculateBacktestMetrics(simulatedTrades, config.initialBalance);

    // Save backtest result to database
    await this.saveBacktestResult(config.userId, config, result);

    return result;
  }

  /**
   * Simulate automation logic on historical trades
   */
  private async simulateAutomation(
    historicalTrades: any[],
    automationType: string,
    automationConfig: any,
    initialBalance: number
  ): Promise<BacktestTrade[]> {
    const simulatedTrades: BacktestTrade[] = [];
    let currentBalance = initialBalance;

    for (const trade of historicalTrades) {
      // Convert LN Markets trade format to our format
      const backtestTrade: BacktestTrade = {
        id: trade.id,
        entryTime: new Date(trade.creation_ts),
        exitTime: new Date(trade.close_ts || trade.creation_ts),
        side: trade.side === 'b' ? 'long' : 'short',
        entryPrice: trade.price,
        exitPrice: trade.close_price || trade.price,
        quantity: trade.quantity,
        pnl: trade.pl || 0,
        pnlPercentage: 0,
      };

      // Calculate P&L percentage
      backtestTrade.pnlPercentage = (backtestTrade.pnl / (backtestTrade.entryPrice * backtestTrade.quantity)) * 100;

      // Apply automation logic
      const automationAction = this.applyAutomationLogic(
        backtestTrade,
        automationType,
        automationConfig,
        currentBalance
      );

      if (automationAction) {
        backtestTrade.automationAction = automationAction;
      }

      // Update balance
      currentBalance += backtestTrade.pnl;

      simulatedTrades.push(backtestTrade);
    }

    return simulatedTrades;
  }

  /**
   * Apply automation logic to a trade
   */
  private applyAutomationLogic(
    trade: BacktestTrade,
    automationType: string,
    automationConfig: any,
    currentBalance: number
  ): string | null {
    switch (automationType) {
      case 'margin_guard':
        return this.applyMarginGuardLogic(trade, automationConfig, currentBalance);

      case 'tp_sl':
        return this.applyTpSlLogic(trade, automationConfig);

      case 'auto_entry':
        return this.applyAutoEntryLogic(trade, automationConfig);

      default:
        return null;
    }
  }

  /**
   * Apply Margin Guard logic in backtest
   */
  private applyMarginGuardLogic(
    trade: BacktestTrade,
    config: any,
    currentBalance: number
  ): string | null {
    const { margin_threshold = 10, action = 'close_position' } = config;

    // Simulate margin level calculation
    const marginLevel = (currentBalance / (currentBalance + Math.abs(trade.pnl))) * 100;

    if (marginLevel < margin_threshold) {
      return `Margin Guard: ${action} (margin: ${marginLevel.toFixed(2)}% < ${margin_threshold}%)`;
    }

    return null;
  }

  /**
   * Apply TP/SL logic in backtest
   */
  private applyTpSlLogic(trade: BacktestTrade, config: any): string | null {
    const { takeprofit, stoploss } = config;

    if (takeprofit && trade.pnlPercentage >= takeprofit) {
      return `Take Profit triggered at ${takeprofit}%`;
    }

    if (stoploss && trade.pnlPercentage <= -Math.abs(stoploss)) {
      return `Stop Loss triggered at ${stoploss}%`;
    }

    return null;
  }

  /**
   * Apply Auto Entry logic in backtest
   */
  private applyAutoEntryLogic(trade: BacktestTrade, config: any): string | null {
    const { trigger_price, trigger_type = 'market' } = config;

    if (trigger_price && trigger_type === 'market') {
      const shouldTrigger = trade.side === 'long'
        ? trade.entryPrice <= trigger_price
        : trade.entryPrice >= trigger_price;

      if (shouldTrigger) {
        return `Auto Entry triggered at price ${trigger_price}`;
      }
    }

    return 'Auto Entry executed';
  }

  /**
   * Calculate backtest performance metrics
   */
  private calculateBacktestMetrics(
    trades: BacktestTrade[],
    initialBalance: number
  ): BacktestResult {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

    // Calculate drawdown
    let peak = initialBalance;
    let maxDrawdown = 0;
    let currentBalance = initialBalance;

    const performance: BacktestPerformance[] = [];
    const dailyPnls = new Map<string, number>();

    // Group trades by date and calculate daily performance
    trades.forEach(trade => {
      const date = trade.exitTime.toISOString().split('T')[0];
      if (!dailyPnls.has(date)) {
        dailyPnls.set(date, 0);
      }
      dailyPnls.set(date, dailyPnls.get(date)! + trade.pnl);
    });

    // Calculate drawdown from daily balances
    Array.from(dailyPnls.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, dailyPnl]) => {
        currentBalance += dailyPnl;
        peak = Math.max(peak, currentBalance);
        const drawdown = peak > 0 ? ((peak - currentBalance) / peak) * 100 : 0;
        maxDrawdown = Math.max(maxDrawdown, drawdown);

        performance.push({
          date: new Date(date),
          balance: currentBalance,
          pnl: dailyPnl,
          drawdown,
        });
      });

    // Calculate Sharpe ratio (simplified)
    const returns = performance.map(p => p.pnl / initialBalance);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnl,
      maxDrawdown,
      sharpeRatio,
      trades,
      performance,
    };
  }

  /**
   * Save backtest result to database
   */
  private async saveBacktestResult(
    userId: string,
    config: BacktestConfig,
    result: BacktestResult
  ): Promise<void> {
    await prisma.backtestReport.create({
      data: {
        user_id: userId,
        config: {
          startDate: config.startDate,
          endDate: config.endDate,
          initialBalance: config.initialBalance,
          automationType: config.automationType,
          automationConfig: config.automationConfig,
        },
        result: {
          totalTrades: result.totalTrades,
          winningTrades: result.winningTrades,
          losingTrades: result.losingTrades,
          winRate: result.winRate,
          totalPnl: result.totalPnl,
          maxDrawdown: result.maxDrawdown,
          sharpeRatio: result.sharpeRatio,
          tradeSummary: result.trades.map(t => ({
            id: t.id,
            side: t.side,
            pnl: t.pnl,
            pnlPercentage: t.pnlPercentage,
            automationAction: t.automationAction,
          })),
        },
      },
    });
  }

  /**
   * Get user's backtest history
   */
  async getUserBacktests(userId: string, limit: number = 10): Promise<any[]> {
    const backtests = await prisma.backtestReport.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    return backtests;
  }

  /**
   * Get specific backtest result
   */
  async getBacktestResult(userId: string, backtestId: string): Promise<any> {
    const backtest = await prisma.backtestReport.findFirst({
      where: {
        id: backtestId,
        user_id: userId,
      },
    });

    if (!backtest) {
      throw new Error('Backtest not found');
    }

    return backtest;
  }

  /**
   * Delete backtest result
   */
  async deleteBacktest(userId: string, backtestId: string): Promise<void> {
    const backtest = await prisma.backtestReport.findFirst({
      where: {
        id: backtestId,
        user_id: userId,
      },
    });

    if (!backtest) {
      throw new Error('Backtest not found');
    }

    await prisma.backtestReport.delete({
      where: { id: backtestId },
    });
  }
}

// Export singleton instance
export const backtestService = new BacktestService();


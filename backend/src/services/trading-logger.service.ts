import { PrismaClient } from '@prisma/client';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

export interface TradingLogEntry {
  id?: string;
  userId: string;
  action: 'trade_created' | 'trade_updated' | 'trade_closed' | 'position_opened' | 'position_closed' | 'margin_call' | 'risk_alert' | 'api_error' | 'auth_event';
  tradeId?: string;
  market?: string;
  side?: 'b' | 's';
  quantity?: number;
  price?: number;
  leverage?: number;
  stoploss?: number;
  takeprofit?: number;
  oldValue?: number;
  newValue?: number;
  reason?: string;
  metadata?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface PerformanceMetrics {
  executionTime: number;
  apiLatency: number;
  processingTime: number;
  memoryUsage: number;
  cpuUsage?: number;
}

export interface MarketSnapshot {
  price: number;
  volume24h: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volatility: number;
  timestamp: Date;
}

export interface RiskMetrics {
  portfolioExposure: number;
  marginLevel: number;
  unrealizedPnl: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  positionCount: number;
  totalMargin: number;
  availableMargin: number;
}

export class TradingLoggerService {
  private userId: string;
  private sessionId: string;
  private ipAddress?: string;
  private userAgent?: string;

  constructor(userId: string, sessionId: string, ipAddress?: string, userAgent?: string) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }

  /**
   * Log trade creation
   */
  async logTradeCreation(tradeData: {
    tradeId: string;
    market: string;
    side: 'b' | 's';
    quantity: number;
    price: number;
    leverage: number;
    stoploss?: number;
    takeprofit?: number;
    performanceMetrics?: PerformanceMetrics;
    marketSnapshot?: MarketSnapshot;
    riskMetrics?: RiskMetrics;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'trade_created',
      tradeId: tradeData.tradeId,
      market: tradeData.market,
      side: tradeData.side,
      quantity: tradeData.quantity,
      price: tradeData.price,
      leverage: tradeData.leverage,
      stoploss: tradeData.stoploss,
      takeprofit: tradeData.takeprofit,
      metadata: {
        performanceMetrics: tradeData.performanceMetrics,
        marketSnapshot: tradeData.marketSnapshot,
        riskMetrics: tradeData.riskMetrics,
        sessionId: this.sessionId,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      },
      timestamp: new Date(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('TRADE_CREATED', logEntry);
  }

  /**
   * Log trade update (TP/SL)
   */
  async logTradeUpdate(tradeData: {
    tradeId: string;
    updateType: 'takeprofit' | 'stoploss';
    oldValue: number;
    newValue: number;
    reason?: string;
    performanceMetrics?: PerformanceMetrics;
    marketSnapshot?: MarketSnapshot;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'trade_updated',
      tradeId: tradeData.tradeId,
      oldValue: tradeData.oldValue,
      newValue: tradeData.newValue,
      reason: tradeData.reason,
      metadata: {
        updateType: tradeData.updateType,
        performanceMetrics: tradeData.performanceMetrics,
        marketSnapshot: tradeData.marketSnapshot,
        sessionId: this.sessionId,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      },
      timestamp: new Date(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('TRADE_UPDATED', logEntry);
  }

  /**
   * Log trade closure
   */
  async logTradeClosure(tradeData: {
    tradeId: string;
    market: string;
    side: 'b' | 's';
    quantity: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    reason?: string;
    performanceMetrics?: PerformanceMetrics;
    marketSnapshot?: MarketSnapshot;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'trade_closed',
      tradeId: tradeData.tradeId,
      market: tradeData.market,
      side: tradeData.side,
      quantity: tradeData.quantity,
      price: tradeData.exitPrice,
      metadata: {
        entryPrice: tradeData.entryPrice,
        exitPrice: tradeData.exitPrice,
        pnl: tradeData.pnl,
        reason: tradeData.reason,
        performanceMetrics: tradeData.performanceMetrics,
        marketSnapshot: tradeData.marketSnapshot,
        sessionId: this.sessionId,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      },
      timestamp: new Date(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('TRADE_CLOSED', logEntry);
  }

  /**
   * Log margin call event
   */
  async logMarginCall(tradeData: {
    tradeId: string;
    market: string;
    marginLevel: number;
    requiredMargin: number;
    availableMargin: number;
    action: 'warning' | 'call' | 'liquidation';
    performanceMetrics?: PerformanceMetrics;
    marketSnapshot?: MarketSnapshot;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'margin_call',
      tradeId: tradeData.tradeId,
      market: tradeData.market,
      metadata: {
        marginLevel: tradeData.marginLevel,
        requiredMargin: tradeData.requiredMargin,
        availableMargin: tradeData.availableMargin,
        action: tradeData.action,
        performanceMetrics: tradeData.performanceMetrics,
        marketSnapshot: tradeData.marketSnapshot,
        sessionId: this.sessionId,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      },
      timestamp: new Date(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('MARGIN_CALL', logEntry);
  }

  /**
   * Log risk alert
   */
  async logRiskAlert(tradeData: {
    alertType: 'high_exposure' | 'high_leverage' | 'concentration_risk' | 'volatility_risk';
    riskLevel: 'moderate' | 'high' | 'critical';
    message: string;
    riskMetrics?: RiskMetrics;
    marketSnapshot?: MarketSnapshot;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'risk_alert',
      metadata: {
        alertType: tradeData.alertType,
        riskLevel: tradeData.riskLevel,
        message: tradeData.message,
        riskMetrics: tradeData.riskMetrics,
        marketSnapshot: tradeData.marketSnapshot,
        sessionId: this.sessionId,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      },
      timestamp: new Date(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('RISK_ALERT', logEntry);
  }

  /**
   * Log API error
   */
  async logApiError(tradeData: {
    action: string;
    error: string;
    errorCode?: string;
    tradeId?: string;
    retryCount?: number;
    performanceMetrics?: PerformanceMetrics;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'api_error',
      tradeId: tradeData.tradeId,
      reason: tradeData.error,
      metadata: {
        action: tradeData.action,
        error: tradeData.error,
        errorCode: tradeData.errorCode,
        retryCount: tradeData.retryCount,
        performanceMetrics: tradeData.performanceMetrics,
        sessionId: this.sessionId,
        ipAddress: this.ipAddress,
        userAgent: this.userAgent,
      },
      timestamp: new Date(),
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('API_ERROR', logEntry);
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(tradeData: {
    eventType: 'login' | 'logout' | 'token_refresh' | 'auth_failure';
    success: boolean;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const logEntry: TradingLogEntry = {
      userId: this.userId,
      action: 'auth_event',
      metadata: {
        eventType: tradeData.eventType,
        success: tradeData.success,
        reason: tradeData.reason,
        ipAddress: tradeData.ipAddress || this.ipAddress,
        userAgent: tradeData.userAgent || this.userAgent,
        sessionId: this.sessionId,
      },
      timestamp: new Date(),
      ipAddress: tradeData.ipAddress || this.ipAddress,
      userAgent: tradeData.userAgent || this.userAgent,
      sessionId: this.sessionId,
    };

    await this.saveLogEntry(logEntry);
    await this.logToConsole('AUTH_EVENT', logEntry);
  }

  /**
   * Get user's trading logs
   */
  async getUserLogs(
    startDate?: Date,
    endDate?: Date,
    action?: string,
    limit: number = 100
  ): Promise<TradingLogEntry[]> {
    const where: any = {
      userId: this.userId,
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    if (action) {
      where.action = action;
    }

    const logs = await prisma.tradingLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      userId: log.userId,
      action: log.action as any,
      tradeId: log.tradeId,
      market: log.market,
      side: log.side as any,
      quantity: log.quantity ? Number(log.quantity) : undefined,
      price: log.price ? Number(log.price) : undefined,
      leverage: log.leverage,
      stoploss: log.stoploss ? Number(log.stoploss) : undefined,
      takeprofit: log.takeprofit ? Number(log.takeprofit) : undefined,
      oldValue: log.oldValue ? Number(log.oldValue) : undefined,
      newValue: log.newValue ? Number(log.newValue) : undefined,
      reason: log.reason,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      sessionId: log.sessionId,
    }));
  }

  /**
   * Get trading statistics
   */
  async getTradingStats(startDate?: Date, endDate?: Date): Promise<{
    totalTrades: number;
    successfulTrades: number;
    failedTrades: number;
    totalVolume: number;
    totalPnl: number;
    averageExecutionTime: number;
    mostActiveMarket: string;
    riskAlerts: number;
    marginCalls: number;
  }> {
    const where: any = {
      userId: this.userId,
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.tradingLog.findMany({
      where,
    });

    const stats = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalVolume: 0,
      totalPnl: 0,
      averageExecutionTime: 0,
      mostActiveMarket: '',
      riskAlerts: 0,
      marginCalls: 0,
    };

    const marketCounts: { [key: string]: number } = {};
    let totalExecutionTime = 0;
    let executionTimeCount = 0;

    for (const log of logs) {
      switch (log.action) {
        case 'trade_created':
          stats.totalTrades++;
          if (log.quantity) stats.totalVolume += Number(log.quantity);
          if (log.market) {
            marketCounts[log.market] = (marketCounts[log.market] || 0) + 1;
          }
          if (log.metadata && typeof log.metadata === 'object' && 'performanceMetrics' in log.metadata) {
            const perfMetrics = (log.metadata as any).performanceMetrics;
            if (perfMetrics?.executionTime) {
              totalExecutionTime += perfMetrics.executionTime;
              executionTimeCount++;
            }
          }
          break;

        case 'trade_closed':
          if (log.metadata && typeof log.metadata === 'object' && 'pnl' in log.metadata) {
            const pnl = (log.metadata as any).pnl;
            if (pnl !== undefined) {
              stats.totalPnl += pnl;
              if (pnl > 0) {
                stats.successfulTrades++;
              } else {
                stats.failedTrades++;
              }
            }
          }
          break;

        case 'risk_alert':
          stats.riskAlerts++;
          break;

        case 'margin_call':
          stats.marginCalls++;
          break;
      }
    }

    if (executionTimeCount > 0) {
      stats.averageExecutionTime = totalExecutionTime / executionTimeCount;
    }

    stats.mostActiveMarket = Object.keys(marketCounts).reduce((a, b) =>
      marketCounts[a] > marketCounts[b] ? a : b, ''
    );

    return stats;
  }

  /**
   * Private helper methods
   */
  private async saveLogEntry(logEntry: TradingLogEntry): Promise<void> {
    try {
      await prisma.tradingLog.create({
        data: {
          id: this.generateLogId(),
          userId: logEntry.userId,
          action: logEntry.action,
          tradeId: logEntry.tradeId,
          market: logEntry.market,
          side: logEntry.side,
          quantity: logEntry.quantity,
          price: logEntry.price,
          leverage: logEntry.leverage,
          stoploss: logEntry.stoploss,
          takeprofit: logEntry.takeprofit,
          oldValue: logEntry.oldValue,
          newValue: logEntry.newValue,
          reason: logEntry.reason,
          metadata: logEntry.metadata,
          timestamp: logEntry.timestamp,
          ipAddress: logEntry.ipAddress,
          userAgent: logEntry.userAgent,
          sessionId: logEntry.sessionId,
        },
      });
    } catch (error) {
      console.error('Failed to save trading log:', error);
      // Don't throw error to prevent breaking the main flow
    }
  }

  private async logToConsole(level: string, logEntry: TradingLogEntry): Promise<void> {
    const logMessage = {
      level,
      timestamp: logEntry.timestamp.toISOString(),
      userId: logEntry.userId,
      action: logEntry.action,
      tradeId: logEntry.tradeId,
      sessionId: logEntry.sessionId,
      metadata: logEntry.metadata,
    };

    console.log(`[TRADING_LOG] ${JSON.stringify(logMessage)}`);
  }

  private generateLogId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `log_${timestamp}_${random}`;
  }

  /**
   * Create a secure hash for sensitive data
   */
  private createHash(data: string): string {
    return createHmac('sha256', process.env.LOG_HASH_SECRET || 'default-secret')
      .update(data)
      .digest('hex')
      .substr(0, 16);
  }
}

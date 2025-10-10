import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';

export interface TradingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  marginRequired: number;
  availableMargin: number;
  maxPositionSize: number;
  recommendedLeverage?: number;
}

export interface TradeParams {
  market: string;
  side: 'b' | 's';
  quantity: number;
  leverage: number;
  stoploss?: number;
  takeprofit?: number;
}

export interface BalanceInfo {
  balance: number;
  margin: number;
  availableMargin: number;
  marginLevel: number;
  totalExposure: number;
  unrealizedPnl: number;
}

export class TradingValidationService {
  private lnMarketsService: LNMarketsService;

  constructor(lnMarketsService: LNMarketsService) {
    this.lnMarketsService = lnMarketsService;
  }

  /**
   * Validate trade parameters before execution
   */
  async validateTrade(tradeParams: TradeParams): Promise<TradingValidationResult> {
    const result: TradingValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
      marginRequired: 0,
      availableMargin: 0,
      maxPositionSize: 0,
    };

    try {
      // Get current balance and margin info
      const balanceInfo = await this.getBalanceInfo();
      result.availableMargin = balanceInfo.availableMargin;

      // Validate basic parameters
      this.validateBasicParameters(tradeParams, result);

      // Validate balance and margin
      await this.validateBalanceAndMargin(tradeParams, balanceInfo, result);

      // Validate risk management
      this.validateRiskManagement(tradeParams, balanceInfo, result);

      // Validate market conditions
      await this.validateMarketConditions(tradeParams, result);

      // Calculate risk level
      this.calculateRiskLevel(result);

      // Set final validation status
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
      result.riskLevel = 'critical';
      return result;
    }
  }

  /**
   * Get current balance and margin information
   */
  private async getBalanceInfo(): Promise<BalanceInfo> {
    try {
      const userInfo = await this.lnMarketsService.getBalance();
      const positions = await this.lnMarketsService.getRunningTrades();

      const totalExposure = positions.reduce((sum, pos) => {
        return sum + (pos.size || 0) * (pos.entry_price || 0);
      }, 0);

      const unrealizedPnl = positions.reduce((sum, pos) => {
        return sum + (pos.unrealized_pnl || 0);
      }, 0);

      return {
        balance: userInfo.balance || 0,
        margin: userInfo.margin || 0,
        availableMargin: userInfo.available_margin || 0,
        marginLevel: userInfo.margin_level || 0,
        totalExposure,
        unrealizedPnl,
      };
    } catch (error) {
      console.error('Error fetching balance info:', error);
      // Return default values if API fails
      return {
        balance: 0,
        margin: 0,
        availableMargin: 0,
        marginLevel: 0,
        totalExposure: 0,
        unrealizedPnl: 0,
      };
    }
  }

  /**
   * Validate basic trade parameters
   */
  private validateBasicParameters(tradeParams: TradeParams, result: TradingValidationResult): void {
    // Validate market
    if (!tradeParams.market || tradeParams.market.length === 0) {
      result.errors.push('Market is required');
    }

    // Validate side
    if (!tradeParams.side || !['b', 's'].includes(tradeParams.side)) {
      result.errors.push('Valid side (b/s) is required');
    }

    // Validate quantity
    if (!tradeParams.quantity || tradeParams.quantity <= 0) {
      result.errors.push('Quantity must be greater than 0');
    } else if (tradeParams.quantity < 1) {
      result.warnings.push('Quantity is very small, consider minimum position size');
    }

    // Validate leverage
    if (!tradeParams.leverage || tradeParams.leverage <= 0) {
      result.errors.push('Leverage must be greater than 0');
    } else if (tradeParams.leverage > 100) {
      result.errors.push('Leverage cannot exceed 100x');
    } else if (tradeParams.leverage > 50) {
      result.warnings.push('High leverage increases risk significantly');
    }

    // Validate stop loss and take profit
    if (tradeParams.stoploss !== undefined) {
      if (tradeParams.stoploss <= 0) {
        result.errors.push('Stop loss must be greater than 0');
      }
    }

    if (tradeParams.takeprofit !== undefined) {
      if (tradeParams.takeprofit <= 0) {
        result.errors.push('Take profit must be greater than 0');
      }
    }
  }

  /**
   * Validate balance and margin requirements
   */
  private async validateBalanceAndMargin(
    tradeParams: TradeParams,
    balanceInfo: BalanceInfo,
    result: TradingValidationResult
  ): Promise<void> {
    // Calculate required margin
    const positionValue = tradeParams.quantity * (await this.getCurrentPrice(tradeParams.market));
    const marginRequired = positionValue / tradeParams.leverage;
    result.marginRequired = marginRequired;

    // Check if sufficient margin is available
    if (marginRequired > balanceInfo.availableMargin) {
      result.errors.push(
        `Insufficient margin. Required: ${marginRequired.toFixed(2)} sats, Available: ${balanceInfo.availableMargin.toFixed(2)} sats`
      );
    }

    // Check margin level after trade
    const newTotalExposure = balanceInfo.totalExposure + positionValue;
    const newMarginLevel = newTotalExposure > 0 ? (balanceInfo.margin + marginRequired) / newTotalExposure : 1;
    if (newMarginLevel < 0.1) {
      result.errors.push('Trade would result in dangerously low margin level');
    } else if (newMarginLevel < 0.2) {
      result.warnings.push('Trade would result in low margin level');
    }

    // Calculate max position size
    const maxPositionSize = balanceInfo.availableMargin * tradeParams.leverage;
    result.maxPositionSize = maxPositionSize;

    if (positionValue > maxPositionSize) {
      result.errors.push(
        `Position size exceeds maximum allowed. Max: ${maxPositionSize.toFixed(2)} sats`
      );
    }
  }

  /**
   * Validate risk management parameters
   */
  private validateRiskManagement(
    tradeParams: TradeParams,
    balanceInfo: BalanceInfo,
    result: TradingValidationResult
  ): void {
    // Check portfolio exposure
    const positionValue = tradeParams.quantity * 50000; // Approximate BTC price
    const newTotalExposure = balanceInfo.totalExposure + positionValue;
    const exposureRatio = balanceInfo.balance > 0 ? newTotalExposure / balanceInfo.balance : 0;

    if (exposureRatio > 0.8) {
      result.warnings.push('High portfolio exposure (>80%)');
    }

    // Check leverage vs portfolio
    if (tradeParams.leverage > 20 && exposureRatio > 0.5) {
      result.warnings.push('High leverage with significant portfolio exposure');
    }

    // Validate stop loss distance
    if (tradeParams.stoploss && tradeParams.takeprofit) {
      const currentPrice = 50000; // Approximate
      const stopDistance = Math.abs(currentPrice - tradeParams.stoploss) / currentPrice;
      const tpDistance = Math.abs(tradeParams.takeprofit - currentPrice) / currentPrice;

      if (stopDistance < 0.01) {
        result.warnings.push('Stop loss is very close to current price');
      }

      if (tpDistance / stopDistance < 1.5) {
        result.warnings.push('Risk/reward ratio is less than 1.5:1');
      }
    }

    // Recommend leverage based on risk
    if (exposureRatio < 0.3) {
      result.recommendedLeverage = Math.min(tradeParams.leverage * 1.5, 50);
    } else if (exposureRatio > 0.7) {
      result.recommendedLeverage = Math.max(tradeParams.leverage * 0.5, 5);
    }
  }

  /**
   * Validate market conditions
   */
  private async validateMarketConditions(tradeParams: TradeParams, result: TradingValidationResult): Promise<void> {
    try {
      const marketData = await this.lnMarketsService.getMarketData(tradeParams.market);
      
      // Check market volatility
      if (marketData.price_change_24h > 0.1) {
        result.warnings.push('High market volatility detected');
      }

      // Check volume
      if (marketData.volume_24h < 1000000) {
        result.warnings.push('Low market volume may affect execution');
      }

      // Validate stop loss and take profit against current price
      const currentPrice = marketData.price;
      
      if (tradeParams.stoploss) {
        if (tradeParams.side === 'b' && tradeParams.stoploss >= currentPrice) {
          result.errors.push('Stop loss for long position must be below current price');
        }
        if (tradeParams.side === 's' && tradeParams.stoploss <= currentPrice) {
          result.errors.push('Stop loss for short position must be above current price');
        }
      }

      if (tradeParams.takeprofit) {
        if (tradeParams.side === 'b' && tradeParams.takeprofit <= currentPrice) {
          result.errors.push('Take profit for long position must be above current price');
        }
        if (tradeParams.side === 's' && tradeParams.takeprofit >= currentPrice) {
          result.errors.push('Take profit for short position must be below current price');
        }
      }
    } catch (error) {
      result.warnings.push('Unable to validate market conditions');
    }
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(result: TradingValidationResult): void {
    let riskScore = 0;

    // Count errors and warnings
    riskScore += result.errors.length * 3;
    riskScore += result.warnings.length * 1;

    // Adjust for margin level
    if (result.marginRequired > result.availableMargin * 0.8) {
      riskScore += 2;
    }

    // Determine risk level
    if (riskScore >= 6 || result.errors.length > 0) {
      result.riskLevel = 'critical';
    } else if (riskScore >= 4) {
      result.riskLevel = 'high';
    } else if (riskScore >= 2) {
      result.riskLevel = 'moderate';
    } else {
      result.riskLevel = 'low';
    }
  }

  /**
   * Get current market price
   */
  private async getCurrentPrice(market: string): Promise<number> {
    try {
      const marketData = await this.lnMarketsService.getMarketData(market);
      return marketData.price || 50000; // Default BTC price
    } catch (error) {
      console.error('Error fetching current price:', error);
      return 50000; // Default BTC price
    }
  }

  /**
   * Validate position update (TP/SL)
   */
  async validatePositionUpdate(
    tradeId: string,
    updateType: 'takeprofit' | 'stoploss',
    newValue: number
  ): Promise<TradingValidationResult> {
    const result: TradingValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
      marginRequired: 0,
      availableMargin: 0,
      maxPositionSize: 0,
    };

    try {
      // Get current position
      const positions = await this.lnMarketsService.getRunningTrades();
      const position = positions.find(p => p.id === tradeId);

      if (!position) {
        result.errors.push('Position not found');
        result.isValid = false;
        return result;
      }

      // Get current market price
      const currentPrice = await this.getCurrentPrice(position.market);

      // Validate update value
      if (updateType === 'takeprofit') {
        if (position.side === 'b' && newValue <= currentPrice) {
          result.errors.push('Take profit for long position must be above current price');
        }
        if (position.side === 's' && newValue >= currentPrice) {
          result.errors.push('Take profit for short position must be below current price');
        }
      } else if (updateType === 'stoploss') {
        if (position.side === 'b' && newValue >= currentPrice) {
          result.errors.push('Stop loss for long position must be below current price');
        }
        if (position.side === 's' && newValue <= currentPrice) {
          result.errors.push('Stop loss for short position must be above current price');
        }
      }

    // Check if update is too close to current price
    const distance = currentPrice > 0 ? Math.abs(newValue - currentPrice) / currentPrice : 0;
    if (distance < 0.005) {
      result.warnings.push('Update level is very close to current price');
    }

      result.isValid = result.errors.length === 0;
      return result;
    } catch (error: any) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
      return result;
    }
  }
}

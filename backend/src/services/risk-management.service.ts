import { PrismaClient } from '@prisma/client';
import { LNMarketsService } from './lnmarkets.service';
import { TradingLoggerService } from './trading-logger.service';

const prisma = new PrismaClient();

export interface RiskLimits {
  maxExposure: number; // Percentual máximo de exposição (0-1)
  maxDailyLoss: number; // Perda máxima diária em sats
  maxPositionSize: number; // Tamanho máximo de posição em sats
  maxLeverage: number; // Alavancagem máxima permitida
  stopLossThreshold: number; // Threshold para stop loss automático (0-1)
}

export interface RiskMetrics {
  currentExposure: number; // Exposição atual (0-1)
  dailyPnL: number; // P&L do dia em sats
  portfolioValue: number; // Valor total do portfólio em sats
  marginLevel: number; // Nível de margem atual (0-1)
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  positionCount: number; // Número de posições abertas
  totalMargin: number; // Margem total utilizada em sats
  availableMargin: number; // Margem disponível em sats
}

export interface RiskAlert {
  type: 'exposure_limit' | 'daily_loss' | 'position_size' | 'leverage' | 'margin_call' | 'stop_loss';
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  limitValue: number;
  action: 'block_trade' | 'reduce_position' | 'close_position' | 'alert_only';
  timestamp: Date;
}

export class RiskManagementService {
  private lnMarketsService: LNMarketsService;
  private loggerService: TradingLoggerService;

  constructor(
    lnMarketsService: LNMarketsService,
    loggerService: TradingLoggerService
  ) {
    this.lnMarketsService = lnMarketsService;
    this.loggerService = loggerService;
  }

  /**
   * Calcula métricas de risco atuais do usuário
   */
  async calculateRiskMetrics(userId: string): Promise<RiskMetrics> {
    try {
      // Obter saldo e posições do usuário
      const balance = await this.lnMarketsService.getBalance();
      const positions = await this.lnMarketsService.getRunningTrades();

      // Calcular exposição atual
      const totalExposure = positions.reduce((sum, position) => {
        return sum + (position.quantity * position.entryPrice);
      }, 0);

      const currentExposure = balance.balance > 0 ? totalExposure / balance.balance : 0;

      // Calcular P&L do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyPnL = positions.reduce((sum, position) => {
        const unrealizedPnl = (position.currentPrice - position.entryPrice) * position.quantity;
        return sum + unrealizedPnl;
      }, 0);

      // Determinar nível de risco
      let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      
      if (currentExposure > 0.8 || balance.marginLevel < 0.2) {
        riskLevel = 'critical';
      } else if (currentExposure > 0.6 || balance.marginLevel < 0.4) {
        riskLevel = 'high';
      } else if (currentExposure > 0.4 || balance.marginLevel < 0.6) {
        riskLevel = 'moderate';
      }

      return {
        currentExposure,
        dailyPnL,
        portfolioValue: balance.balance,
        marginLevel: balance.marginLevel,
        riskLevel,
        positionCount: positions.length,
        totalMargin: balance.margin,
        availableMargin: balance.available_margin,
      };
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      throw new Error('Failed to calculate risk metrics');
    }
  }

  /**
   * Valida se um trade pode ser executado baseado nos limites de risco
   */
  async validateTradeRisk(
    userId: string,
    tradeParams: {
      quantity: number;
      price: number;
      leverage: number;
      side: 'b' | 's';
    },
    riskLimits: RiskLimits
  ): Promise<{ isValid: boolean; alerts: RiskAlert[] }> {
    const alerts: RiskAlert[] = [];
    
    try {
      const riskMetrics = await this.calculateRiskMetrics(userId);
      
      // Validar exposição máxima
      const newExposure = riskMetrics.currentExposure + (tradeParams.quantity * tradeParams.price) / riskMetrics.portfolioValue;
      if (newExposure > riskLimits.maxExposure) {
        alerts.push({
          type: 'exposure_limit',
          severity: 'critical',
          message: `Trade would exceed maximum exposure limit of ${(riskLimits.maxExposure * 100).toFixed(1)}%`,
          currentValue: newExposure,
          limitValue: riskLimits.maxExposure,
          action: 'block_trade',
          timestamp: new Date(),
        });
      }

      // Validar tamanho máximo de posição
      const positionSize = tradeParams.quantity * tradeParams.price;
      if (positionSize > riskLimits.maxPositionSize) {
        alerts.push({
          type: 'position_size',
          severity: 'critical',
          message: `Position size ${positionSize} exceeds maximum allowed ${riskLimits.maxPositionSize}`,
          currentValue: positionSize,
          limitValue: riskLimits.maxPositionSize,
          action: 'block_trade',
          timestamp: new Date(),
        });
      }

      // Validar alavancagem máxima
      if (tradeParams.leverage > riskLimits.maxLeverage) {
        alerts.push({
          type: 'leverage',
          severity: 'critical',
          message: `Leverage ${tradeParams.leverage}x exceeds maximum allowed ${riskLimits.maxLeverage}x`,
          currentValue: tradeParams.leverage,
          limitValue: riskLimits.maxLeverage,
          action: 'block_trade',
          timestamp: new Date(),
        });
      }

      // Validar perda diária máxima
      const potentialLoss = tradeParams.quantity * tradeParams.price * (1 / tradeParams.leverage);
      if (riskMetrics.dailyPnL + potentialLoss < -riskLimits.maxDailyLoss) {
        alerts.push({
          type: 'daily_loss',
          severity: 'critical',
          message: `Trade would exceed maximum daily loss limit of ${riskLimits.maxDailyLoss} sats`,
          currentValue: riskMetrics.dailyPnL + potentialLoss,
          limitValue: -riskLimits.maxDailyLoss,
          action: 'block_trade',
          timestamp: new Date(),
        });
      }

      // Validar nível de margem
      if (riskMetrics.marginLevel < 0.1) {
        alerts.push({
          type: 'margin_call',
          severity: 'critical',
          message: 'Margin level too low for new trades',
          currentValue: riskMetrics.marginLevel,
          limitValue: 0.1,
          action: 'block_trade',
          timestamp: new Date(),
        });
      }

      const isValid = alerts.length === 0 || alerts.every(alert => alert.action !== 'block_trade');
      
      return { isValid, alerts };
    } catch (error) {
      console.error('Error validating trade risk:', error);
      throw new Error('Failed to validate trade risk');
    }
  }

  /**
   * Monitora posições e executa stop loss automático
   */
  async monitorPositions(userId: string, riskLimits: RiskLimits): Promise<void> {
    try {
      const positions = await this.lnMarketsService.getRunningTrades();
      
      for (const position of positions) {
        // Calcular perda atual
        const currentLoss = (position.currentPrice - position.entryPrice) * position.quantity;
        const lossPercentage = Math.abs(currentLoss) / (position.quantity * position.entryPrice);
        
        // Verificar se deve executar stop loss automático
        if (lossPercentage >= riskLimits.stopLossThreshold) {
          try {
            await this.lnMarketsService.closePosition(position.id);
            
            // Log da ação
            await this.loggerService.logRiskAlert({
              alertType: 'high_exposure',
              message: `Automatic stop loss executed for position ${position.id}`,
              riskLevel: 'critical',
              riskMetrics: {
                totalMargin: 0,
                availableMargin: 0,
                marginLevel: 0,
                portfolioExposure: 0,
                positionCount: 0,
                unrealizedPnl: currentLoss,
                riskLevel: 'critical',
              },
              marketSnapshot: {
                price: position.currentPrice,
                priceChange24h: 0,
                volume24h: 0,
                high24h: position.currentPrice,
                low24h: position.currentPrice,
                volatility: 0,
                timestamp: new Date(),
              },
            });
            
            console.log(`Automatic stop loss executed for position ${position.id}`);
          } catch (error) {
            console.error(`Failed to execute stop loss for position ${position.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring positions:', error);
    }
  }

  /**
   * Reduz automaticamente a exposição quando necessário
   */
  async reduceExposure(userId: string, riskLimits: RiskLimits): Promise<void> {
    try {
      const riskMetrics = await this.calculateRiskMetrics(userId);
      
      if (riskMetrics.currentExposure > riskLimits.maxExposure) {
        const positions = await this.lnMarketsService.getRunningTrades();
        
        // Ordenar posições por perda (fechar as mais perdedoras primeiro)
        const sortedPositions = positions.sort((a, b) => {
          const lossA = (a.currentPrice - a.entryPrice) * a.quantity;
          const lossB = (b.currentPrice - b.entryPrice) * b.quantity;
          return lossA - lossB;
        });
        
        // Fechar posições até reduzir a exposição
        let currentExposure = riskMetrics.currentExposure;
        for (const position of sortedPositions) {
          if (currentExposure <= riskLimits.maxExposure) break;
          
          try {
            await this.lnMarketsService.closePosition(position.id);
            currentExposure -= (position.quantity * position.entryPrice) / riskMetrics.portfolioValue;
            
            console.log(`Reduced exposure by closing position ${position.id}`);
          } catch (error) {
            console.error(`Failed to close position ${position.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error reducing exposure:', error);
    }
  }

  /**
   * Obtém limites de risco padrão para um usuário
   */
  async getDefaultRiskLimits(userId: string): Promise<RiskLimits> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { risk_profile: true },
      });

      // Limites baseados no perfil de risco do usuário
      const riskProfiles = {
        conservative: {
          maxExposure: 0.3,
          maxDailyLoss: 10000,
          maxPositionSize: 50000,
          maxLeverage: 3,
          stopLossThreshold: 0.05,
        },
        moderate: {
          maxExposure: 0.5,
          maxDailyLoss: 25000,
          maxPositionSize: 100000,
          maxLeverage: 5,
          stopLossThreshold: 0.08,
        },
        aggressive: {
          maxExposure: 0.7,
          maxDailyLoss: 50000,
          maxPositionSize: 200000,
          maxLeverage: 10,
          stopLossThreshold: 0.12,
        },
      };

      const profile = user?.risk_profile || 'moderate';
      return riskProfiles[profile as keyof typeof riskProfiles];
    } catch (error) {
      console.error('Error getting default risk limits:', error);
      // Retornar limites conservadores como fallback
      return {
        maxExposure: 0.3,
        maxDailyLoss: 10000,
        maxPositionSize: 50000,
        maxLeverage: 3,
        stopLossThreshold: 0.05,
      };
    }
  }

  /**
   * Atualiza limites de risco para um usuário
   */
  async updateRiskLimits(userId: string, limits: Partial<RiskLimits>): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          risk_limits: JSON.stringify(limits),
        },
      });
    } catch (error) {
      console.error('Error updating risk limits:', error);
      throw new Error('Failed to update risk limits');
    }
  }

  /**
   * Gera alertas de risco em tempo real
   */
  async generateRiskAlerts(userId: string): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];
    
    try {
      const riskMetrics = await this.calculateRiskMetrics(userId);
      const riskLimits = await this.getDefaultRiskLimits(userId);
      
      // Alert de exposição alta
      if (riskMetrics.currentExposure > riskLimits.maxExposure * 0.8) {
        alerts.push({
          type: 'exposure_limit',
          severity: riskMetrics.currentExposure > riskLimits.maxExposure ? 'critical' : 'warning',
          message: `Portfolio exposure is ${(riskMetrics.currentExposure * 100).toFixed(1)}%`,
          currentValue: riskMetrics.currentExposure,
          limitValue: riskLimits.maxExposure,
          action: riskMetrics.currentExposure > riskLimits.maxExposure ? 'reduce_position' : 'alert_only',
          timestamp: new Date(),
        });
      }
      
      // Alert de perda diária
      if (riskMetrics.dailyPnL < -riskLimits.maxDailyLoss * 0.8) {
        alerts.push({
          type: 'daily_loss',
          severity: riskMetrics.dailyPnL < -riskLimits.maxDailyLoss ? 'critical' : 'warning',
          message: `Daily P&L is ${riskMetrics.dailyPnL} sats`,
          currentValue: riskMetrics.dailyPnL,
          limitValue: -riskLimits.maxDailyLoss,
          action: riskMetrics.dailyPnL < -riskLimits.maxDailyLoss ? 'close_position' : 'alert_only',
          timestamp: new Date(),
        });
      }
      
      // Alert de margem baixa
      if (riskMetrics.marginLevel < 0.2) {
        alerts.push({
          type: 'margin_call',
          severity: 'critical',
          message: `Margin level is critically low: ${(riskMetrics.marginLevel * 100).toFixed(1)}%`,
          currentValue: riskMetrics.marginLevel,
          limitValue: 0.2,
          action: 'close_position',
          timestamp: new Date(),
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Error generating risk alerts:', error);
      return [];
    }
  }
}

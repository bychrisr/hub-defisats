import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
import { websocketManager } from '../services/websocket-manager.service';
import { AutomationLoggerService } from '../services/automation-logger.service';
import { NotificationCentralService } from '../services/notification-central.service';
import { PlanLimitsService } from '../services/plan-limits.service';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';

interface MarginGuardConfig {
  id: string;
  user_id: string;
  is_active: boolean;
  mode: 'unitario' | 'global';
  margin_threshold: number; // % de distância para acionar
  add_margin_percentage: number; // % de margem a adicionar
  selected_positions: string[]; // IDs das posições (modo unitário)
  created_at: Date;
  updated_at: Date;
}

interface PositionData {
  trade_id: string;
  current_price: number;
  liquidation_price: number;
  margin: number;
  entry_price: number;
  side: 'b' | 's';
  fees: {
    opening_fee: number;
    closing_fee: number;
    maintenance_margin: number;
    sum_carry_fees: number;
  };
  timestamp: number;
}

interface LiquidationDistance {
  absolute: number;
  percentage: number;
  triggerPrice: number;
  activationDistance: number;
  isAtRisk: boolean;
}

interface MarginCalculation {
  baseMargin: number;
  fees: {
    opening_fee: number;
    closing_fee: number;
    maintenance_margin: number;
    sum_carry_fees: number;
  };
  totalCost: number;
  newMargin: number;
  newLiquidationPrice: number;
}

export class MarginGuardV2Worker extends EventEmitter {
  private prisma: PrismaClient;
  private automationLogger: AutomationLoggerService;
  private notificationService: NotificationCentralService;
  private planLimitsService: PlanLimitsService;
  private userExchangeService: UserExchangeAccountService;
  private activeConfigs: Map<string, MarginGuardConfig> = new Map();
  private isRunning: boolean = false;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.automationLogger = new AutomationLoggerService(prisma);
    this.notificationService = new NotificationCentralService(prisma);
    this.planLimitsService = new PlanLimitsService(prisma);
    this.userExchangeService = new UserExchangeAccountService(prisma);
  }

  /**
   * Inicializar o worker
   */
  async initialize(): Promise<void> {
    console.log('🚀 MARGIN GUARD V2 - Initializing worker...');

    try {
      // 1. Configurar listeners do WebSocket
      this.setupWebSocketListeners();

      // 2. Carregar configurações ativas
      await this.loadActiveConfigurations();

      // 3. Configurar conexões WebSocket para usuários ativos
      await this.setupUserConnections();

      this.isRunning = true;
      console.log('✅ MARGIN GUARD V2 - Worker initialized successfully');

    } catch (error) {
      console.error('❌ MARGIN GUARD V2 - Failed to initialize worker:', error);
      throw error;
    }
  }

  /**
   * Configurar listeners do WebSocket Manager
   */
  private setupWebSocketListeners(): void {
    // Listener para atualizações de posição
    websocketManager.on('positionUpdate', async (userId: string, positionData: PositionData) => {
      await this.handlePositionUpdate(userId, positionData);
    });

    // Listener para atualizações de preço
    websocketManager.on('marketUpdate', async (userId: string, marketData: any) => {
      await this.handleMarketUpdate(userId, marketData);
    });

    // Listener para erros de conexão
    websocketManager.on('userError', (userId: string, error: any) => {
      console.error(`❌ MARGIN GUARD V2 - WebSocket error for user ${userId}:`, error);
    });

    console.log('🔌 MARGIN GUARD V2 - WebSocket listeners configured');
  }

  /**
   * Carregar configurações ativas do Margin Guard
   */
  private async loadActiveConfigurations(): Promise<void> {
    try {
      const configs = await this.prisma.marginGuardConfig.findMany({
        where: { is_active: true },
        include: {
          user: {
            include: {
              userExchangeAccounts: {
                where: { is_active: true },
                take: 1
              }
            }
          }
        }
      });

      console.log(`📦 MARGIN GUARD V2 - Loaded ${configs.length} active configurations`);

      for (const config of configs) {
        this.activeConfigs.set(config.user_id, config);
        console.log(`📋 MARGIN GUARD V2 - Loaded config for user ${config.user_id}:`, {
          mode: config.mode,
          margin_threshold: config.margin_threshold,
          add_margin_percentage: config.add_margin_percentage,
          selected_positions: config.selected_positions.length
        });
      }

    } catch (error) {
      console.error('❌ MARGIN GUARD V2 - Failed to load active configurations:', error);
      throw error;
    }
  }

  /**
   * Configurar conexões WebSocket para usuários com configurações ativas
   */
  private async setupUserConnections(): Promise<void> {
    for (const [userId, config] of this.activeConfigs) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            userExchangeAccounts: {
              where: { is_active: true },
              take: 1
            }
          }
        });

        if (!user || !user.userExchangeAccounts.length) {
          console.warn(`⚠️ MARGIN GUARD V2 - No active exchange account for user ${userId}`);
          continue;
        }

        const account = user.userExchangeAccounts[0];
        const credentials = {
          apiKey: account.credentials['API Key'],
          apiSecret: account.credentials['API Secret'],
          passphrase: account.credentials['Passphrase'],
          isTestnet: account.credentials.isTestnet === 'true' || account.credentials.testnet === 'true'
        };

        await websocketManager.createConnection(userId, credentials);
        console.log(`🔌 MARGIN GUARD V2 - WebSocket connection established for user ${userId}`);

      } catch (error) {
        console.error(`❌ MARGIN GUARD V2 - Failed to setup connection for user ${userId}:`, error);
      }
    }
  }

  /**
   * Processar atualização de posição
   */
  private async handlePositionUpdate(userId: string, positionData: PositionData): Promise<void> {
    try {
      console.log('🔍 MARGIN GUARD V2 - Processing position update:', {
        userId,
        tradeId: positionData.trade_id,
        currentPrice: positionData.current_price,
        liquidationPrice: positionData.liquidation_price,
        timestamp: new Date(positionData.timestamp).toISOString()
      });

      // 1. Validar timestamp (não usar dados antigos)
      if (Date.now() - positionData.timestamp > 30000) {
        console.warn('⚠️ MARGIN GUARD V2 - Position data too old, skipping:', {
          userId,
          tradeId: positionData.trade_id,
          dataAge: Date.now() - positionData.timestamp
        });
        return;
      }

      // 2. Buscar configuração ativa do usuário
      const config = this.activeConfigs.get(userId);
      if (!config) {
        console.log(`📋 MARGIN GUARD V2 - No active config for user ${userId}`);
        return;
      }

      // 3. Verificar se posição está sendo monitorada
      if (!this.isPositionMonitored(config, positionData.trade_id)) {
        console.log(`📋 MARGIN GUARD V2 - Position ${positionData.trade_id} not monitored for user ${userId}`);
        return;
      }

      // 4. Calcular risco de liquidação
      const risk = this.calculateLiquidationRisk(positionData, config);
      if (!risk.isAtRisk) {
        console.log(`📊 MARGIN GUARD V2 - Position ${positionData.trade_id} not at risk:`, {
          distancePercentage: risk.percentage,
          threshold: config.margin_threshold
        });
        return;
      }

      // 5. Executar proteção
      await this.executeProtection(userId, config, positionData, risk);

    } catch (error) {
      console.error('❌ MARGIN GUARD V2 - Error processing position update:', error);
    }
  }

  /**
   * Processar atualização de mercado
   */
  private async handleMarketUpdate(userId: string, marketData: any): Promise<void> {
    // Para o Margin Guard V2, focamos apenas em positionUpdate
    // Market updates são usados para outros workers
    console.log('📊 MARGIN GUARD V2 - Market update received (not used for Margin Guard)');
  }

  /**
   * Verificar se posição está sendo monitorada
   */
  private isPositionMonitored(config: MarginGuardConfig, tradeId: string): boolean {
    if (config.mode === 'global') {
      return true; // Monitora todas as posições
    }

    if (config.mode === 'unitario') {
      return config.selected_positions.includes(tradeId);
    }

    return false;
  }

  /**
   * Calcular risco de liquidação
   */
  private calculateLiquidationRisk(
    positionData: PositionData, 
    config: MarginGuardConfig
  ): LiquidationDistance {
    
    const entryPrice = positionData.entry_price;
    const liquidationPrice = positionData.liquidation_price;
    const currentPrice = positionData.current_price;
    const side = positionData.side;

    // 1. Validar dados
    if (liquidationPrice <= 0 || currentPrice <= 0 || entryPrice <= 0) {
      throw new Error('Preços inválidos para cálculo de risco');
    }

    // 2. Calcular distância absoluta
    const absolute = Math.abs(entryPrice - liquidationPrice);
    
    // 3. Calcular distância percentual
    const percentage = (absolute / liquidationPrice) * 100;
    
    // 4. Calcular distância de ativação
    const activationDistance = absolute * (1 - config.margin_threshold / 100);
    
    // 5. Calcular preço de trigger
    const triggerPrice = side === 'b' 
      ? liquidationPrice + activationDistance
      : liquidationPrice - activationDistance;
    
    // 6. Verificar se está em risco
    const isAtRisk = side === 'b' 
      ? currentPrice <= triggerPrice
      : currentPrice >= triggerPrice;

    console.log('📊 MARGIN GUARD V2 - Risk calculation:', {
      tradeId: positionData.trade_id,
      entryPrice,
      liquidationPrice,
      currentPrice,
      side,
      absolute,
      percentage,
      activationDistance,
      triggerPrice,
      isAtRisk,
      marginThreshold: config.margin_threshold
    });

    return {
      absolute,
      percentage,
      triggerPrice,
      activationDistance,
      isAtRisk
    };
  }

  /**
   * Calcular margem com taxas
   */
  private calculateMarginWithFees(
    currentMargin: number,
    addMarginPercentage: number,
    positionFees: PositionData['fees'],
    liquidationPrice: number,
    entryPrice: number,
    side: 'b' | 's'
  ): MarginCalculation {
    
    // 1. Calcular margem base
    const baseMargin = currentMargin * (addMarginPercentage / 100);
    
    // 2. Calcular taxas proporcionais
    const feeRatio = baseMargin / currentMargin;
    
    const fees = {
      opening_fee: positionFees.opening_fee * feeRatio,
      closing_fee: positionFees.closing_fee * feeRatio,
      maintenance_margin: positionFees.maintenance_margin * feeRatio,
      sum_carry_fees: positionFees.sum_carry_fees * feeRatio
    };
    
    // 3. Calcular custo total
    const totalCost = baseMargin + 
                     fees.opening_fee + 
                     fees.closing_fee + 
                     fees.maintenance_margin + 
                     fees.sum_carry_fees;
    
    // 4. Nova margem total
    const newMargin = currentMargin + baseMargin;
    
    // 5. Calcular novo preço de liquidação (aproximado)
    const newLiquidationPrice = this.calculateNewLiquidationPrice(
      entryPrice,
      newMargin,
      side
    );
    
    return {
      baseMargin,
      fees,
      totalCost,
      newMargin,
      newLiquidationPrice
    };
  }

  /**
   * Calcular novo preço de liquidação
   */
  private calculateNewLiquidationPrice(
    entryPrice: number,
    newMargin: number,
    side: 'b' | 's'
  ): number {
    // Aproximação simples - na prática, a LN Markets recalcula automaticamente
    const positionSize = 100000000; // 1 BTC em sats
    const marginPerUnit = newMargin / positionSize;
    
    return side === 'b' 
      ? entryPrice - marginPerUnit
      : entryPrice + marginPerUnit;
  }

  /**
   * Executar proteção de margem
   */
  private async executeProtection(
    userId: string,
    config: MarginGuardConfig,
    positionData: PositionData,
    risk: LiquidationDistance
  ): Promise<void> {
    
    const startTime = Date.now();
    
    try {
      console.log('🚨 MARGIN GUARD V2 - Executing protection:', {
        userId,
        tradeId: positionData.trade_id,
        currentPrice: positionData.current_price,
        triggerPrice: risk.triggerPrice,
        distancePercentage: risk.percentage
      });

      // 1. Calcular margem a adicionar
      const marginCalculation = this.calculateMarginWithFees(
        positionData.margin,
        config.add_margin_percentage,
        positionData.fees,
        positionData.liquidation_price,
        positionData.entry_price,
        positionData.side
      );

      // 2. Validar saldo (implementar validação real)
      const hasSufficientBalance = await this.validateBalance(userId, marginCalculation.totalCost);
      if (!hasSufficientBalance) {
        throw new Error('Saldo insuficiente para adicionar margem');
      }

      // 3. Executar na LN Markets
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userExchangeAccounts: {
            where: { is_active: true },
            take: 1
          }
        }
      });

      if (!user || !user.userExchangeAccounts.length) {
        throw new Error('Conta de exchange não encontrada');
      }

      const account = user.userExchangeAccounts[0];
      const lnMarkets = new LNMarketsAPIv2({
        credentials: {
          apiKey: account.credentials['API Key'],
          apiSecret: account.credentials['API Secret'],
          passphrase: account.credentials['Passphrase'],
          isTestnet: account.credentials.isTestnet === 'true' || account.credentials.testnet === 'true'
        },
        logger: console
      });

      const result = await lnMarkets.futures.addMargin({
        trade_id: positionData.trade_id,
        margin: Math.floor(marginCalculation.baseMargin)
      });

      console.log('✅ MARGIN GUARD V2 - Margin added successfully:', {
        userId,
        tradeId: positionData.trade_id,
        marginAdded: marginCalculation.baseMargin,
        totalCost: marginCalculation.totalCost,
        apiResponse: result
      });

      // 4. Registrar execução bem-sucedida
      await this.automationLogger.logExecution({
        userId,
        automationId: config.id,
        automationType: 'margin_guard',
        tradeId: positionData.trade_id,
        action: 'add_margin',
        status: 'success',
        triggerData: {
          currentPrice: positionData.current_price,
          triggerPrice: risk.triggerPrice,
          distanceToLiquidation: risk.absolute,
          marginThreshold: config.margin_threshold,
          positionSide: positionData.side,
          entryPrice: positionData.entry_price,
          liquidationPrice: positionData.liquidation_price,
          currentMargin: positionData.margin
        },
        executionResult: {
          marginAdded: marginCalculation.baseMargin,
          fees: marginCalculation.fees,
          totalCost: marginCalculation.totalCost,
          newMargin: marginCalculation.newMargin,
          newLiquidationPrice: marginCalculation.newLiquidationPrice,
          apiResponse: result
        },
        executionTime: Date.now() - startTime
      });

      // 5. Enviar notificação de sucesso
      await this.notificationService.notify({
        userId,
        type: 'margin_guard',
        priority: 'medium',
        title: 'Margem Adicionada',
        message: `Margin Guard adicionou ${marginCalculation.baseMargin.toLocaleString()} sats de margem à posição ${positionData.trade_id.substring(0, 8)}`,
        metadata: { 
          tradeId: positionData.trade_id, 
          marginAdded: marginCalculation.baseMargin,
          totalCost: marginCalculation.totalCost,
          newLiquidationPrice: marginCalculation.newLiquidationPrice
        }
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD V2 - Protection execution failed:', {
        userId,
        tradeId: positionData.trade_id,
        error: error.message,
        stack: error.stack
      });

      // Registrar erro
      await this.automationLogger.logExecution({
        userId,
        automationId: config.id,
        automationType: 'margin_guard',
        tradeId: positionData.trade_id,
        action: 'add_margin',
        status: 'error',
        triggerData: {
          currentPrice: positionData.current_price,
          triggerPrice: risk.triggerPrice,
          distanceToLiquidation: risk.absolute,
          marginThreshold: config.margin_threshold,
          positionSide: positionData.side,
          entryPrice: positionData.entry_price,
          liquidationPrice: positionData.liquidation_price,
          currentMargin: positionData.margin
        },
        errorMessage: error.message,
        executionTime: Date.now() - startTime
      });

      // Enviar notificação de erro
      await this.notificationService.notify({
        userId,
        type: 'margin_guard',
        priority: 'high',
        title: 'Erro no Margin Guard',
        message: `Falha ao adicionar margem: ${error.message}`,
        metadata: { 
          tradeId: positionData.trade_id, 
          error: error.message 
        }
      });
    }
  }

  /**
   * Validar saldo disponível
   */
  private async validateBalance(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userExchangeAccounts: {
            where: { is_active: true },
            take: 1
          }
        }
      });

      if (!user || !user.userExchangeAccounts.length) {
        return false;
      }

      const account = user.userExchangeAccounts[0];
      const lnMarkets = new LNMarketsAPIv2({
        credentials: {
          apiKey: account.credentials['API Key'],
          apiSecret: account.credentials['API Secret'],
          passphrase: account.credentials['Passphrase'],
          isTestnet: account.credentials.isTestnet === 'true' || account.credentials.testnet === 'true'
        },
        logger: console
      });

      const balance = await lnMarkets.user.getUser();
      const availableBalance = balance.balance || 0;
      
      // Adicionar margem de segurança (5%)
      const safetyMargin = requiredAmount * 0.05;
      const totalRequired = requiredAmount + safetyMargin;
      
      return availableBalance >= totalRequired;

    } catch (error) {
      console.error('❌ MARGIN GUARD V2 - Balance validation failed:', error);
      return false;
    }
  }

  /**
   * Adicionar nova configuração
   */
  async addConfiguration(config: MarginGuardConfig): Promise<void> {
    this.activeConfigs.set(config.user_id, config);
    
    // Configurar WebSocket para o usuário se necessário
    await this.setupUserConnections();
    
    console.log('✅ MARGIN GUARD V2 - Configuration added:', {
      userId: config.user_id,
      mode: config.mode,
      marginThreshold: config.margin_threshold
    });
  }

  /**
   * Remover configuração
   */
  async removeConfiguration(userId: string): Promise<void> {
    this.activeConfigs.delete(userId);
    console.log('🗑️ MARGIN GUARD V2 - Configuration removed:', { userId });
  }

  /**
   * Parar o worker
   */
  async shutdown(): Promise<void> {
    console.log('🛑 MARGIN GUARD V2 - Shutting down worker...');
    this.isRunning = false;
    this.removeAllListeners();
    console.log('✅ MARGIN GUARD V2 - Worker shutdown complete');
  }

  /**
   * Status do worker
   */
  getStatus(): { isRunning: boolean; activeConfigs: number } {
    return {
      isRunning: this.isRunning,
      activeConfigs: this.activeConfigs.size
    };
  }
}

// Singleton instance
let marginGuardV2Worker: MarginGuardV2Worker | null = null;

export function getMarginGuardV2Worker(prisma?: PrismaClient): MarginGuardV2Worker {
  if (!marginGuardV2Worker && prisma) {
    marginGuardV2Worker = new MarginGuardV2Worker(prisma);
  }
  
  if (!marginGuardV2Worker) {
    throw new Error('MarginGuardV2Worker not initialized. Call with PrismaClient first.');
  }
  
  return marginGuardV2Worker;
}

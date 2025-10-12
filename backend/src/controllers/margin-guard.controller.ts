import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
import { PlanLimitsService } from '../services/plan-limits.service';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';
import { NotificationCentralService } from '../services/notification-central.service';
import { getMarginGuardV2Worker } from '../workers/margin-guard-v2.worker';

// Removemos a interface customizada e usamos o padrão do Fastify

export class MarginGuardController {
  private prisma: PrismaClient;
  private planLimitsService: PlanLimitsService;
  private userExchangeService: UserExchangeAccountService;
  private notificationService: NotificationCentralService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.planLimitsService = new PlanLimitsService(prisma);
    this.userExchangeService = new UserExchangeAccountService(prisma);
    this.notificationService = new NotificationCentralService(prisma);
  }

  /**
   * Criar ou atualizar configuração do Margin Guard
   */
  async createOrUpdateConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const {
        mode,
        margin_threshold,
        add_margin_percentage,
        selected_positions = [],
        is_active = true
      } = request.body as any;

      // 1. Validar dados
      if (!mode || !margin_threshold || !add_margin_percentage) {
        reply.status(400).send({ 
          error: 'Dados obrigatórios: mode, margin_threshold, add_margin_percentage' 
        });
        return;
      }

      if (!['unitario', 'global'].includes(mode)) {
        reply.status(400).send({ error: 'Mode deve ser "unitario" ou "global"' });
        return;
      }

      if (margin_threshold < 5 || margin_threshold > 95) {
        reply.status(400).send({ error: 'margin_threshold deve estar entre 5% e 95%' });
        return;
      }

      if (add_margin_percentage < 10 || add_margin_percentage > 100) {
        reply.status(400).send({ error: 'add_margin_percentage deve estar entre 10% e 100%' });
        return;
      }

      // 2. Validar limitações do plano
      const planValidation = await this.planLimitsService.validateMarginGuardConfig({
        userId,
        mode,
        selectedPositions: selected_positions,
        marginThreshold: margin_threshold,
        addMarginPercentage: add_margin_percentage
      });

      if (!planValidation.isValid) {
        reply.status(403).json({
          error: planValidation.error,
          limitations: planValidation.limitations,
          availableUpgrades: planValidation.availableUpgrades
        });
        return;
      }

      // 3. Se modo unitário, validar posições selecionadas
      if (mode === 'unitario' && selected_positions.length > 0) {
        const positions = await this.fetchRunningPositions(userId);
        const validPositions = positions.map(p => p.trade_id);
        const invalidPositions = selected_positions.filter(id => !validPositions.includes(id));
        
        if (invalidPositions.length > 0) {
          reply.status(400).send({ 
            error: `Posições inválidas: ${invalidPositions.join(', ')}` 
          });
          return;
        }
      }

      // 4. Criar ou atualizar configuração
      const config = await this.prisma.marginGuardConfig.upsert({
        where: { user_id: userId },
        update: {
          mode,
          margin_threshold,
          add_margin_percentage,
          selected_positions: mode === 'unitario' ? selected_positions : [],
          is_active,
          updated_at: new Date()
        },
        create: {
          user_id: userId,
          mode,
          margin_threshold,
          add_margin_percentage,
          selected_positions: mode === 'unitario' ? selected_positions : [],
          is_active
        }
      });

      // 5. Atualizar worker se ativo
      if (is_active) {
        const worker = getMarginGuardV2Worker(this.prisma);
        await worker.addConfiguration(config);
      }

      console.log('✅ MARGIN GUARD API - Configuration saved:', {
        userId,
        configId: config.id,
        mode,
        marginThreshold: margin_threshold,
        addMarginPercentage: add_margin_percentage
      });

      reply.send({
        success: true,
        config: {
          id: config.id,
          mode: config.mode,
          margin_threshold: config.margin_threshold,
          add_margin_percentage: config.add_margin_percentage,
          selected_positions: config.selected_positions,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at
        }
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to create/update config:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar configuração atual do usuário
   */
  async getConfig(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }


      const config = await this.prisma.marginGuardConfig.findUnique({
        where: { user_id: userId }
      });

      if (!config) {
        reply.send({ config: null });
        return;
      }

      reply.send({
        success: true,
        config: {
          id: config.id,
          mode: config.mode,
          margin_threshold: config.margin_threshold,
          add_margin_percentage: config.add_margin_percentage,
          selected_positions: config.selected_positions,
          is_active: config.is_active,
          created_at: config.created_at,
          updated_at: config.updated_at
        }
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get config:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar features do plano atual
   */
  async getPlanFeatures(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        reply.status(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      const planFeatures = this.planLimitsService.getMarginGuardFeatures(user.plan_type);

      reply.send({
        success: true,
        plan_type: user.plan_type,
        features: planFeatures
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get plan features:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar posições running do usuário
   */
  async getRunningPositions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const positions = await this.fetchRunningPositions(userId);

      reply.send({
        success: true,
        positions: positions.map(pos => ({
          trade_id: pos.trade_id,
          side: pos.side,
          entry_price: pos.entry_price,
          liquidation_price: pos.liquidation_price,
          current_price: pos.current_price,
          margin: pos.margin,
          fees: pos.fees,
          distance_percentage: this.calculateDistancePercentage(
            pos.entry_price,
            pos.liquidation_price
          )
        }))
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get running positions:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Preview de cálculo
   */
  async previewCalculation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const {
        position_id,
        margin_threshold,
        add_margin_percentage
      } = request.body as any;

      if (!position_id || !margin_threshold || !add_margin_percentage) {
        reply.status(400).send({ 
          error: 'Dados obrigatórios: position_id, margin_threshold, add_margin_percentage' 
        });
        return;
      }

      // 1. Buscar posição
      const positions = await this.fetchRunningPositions(userId);
      const position = positions.find(p => p.trade_id === position_id);

      if (!position) {
        reply.status(404).json({ error: 'Posição não encontrada' });
        return;
      }

      // 2. Calcular preview
      const preview = this.calculatePreview(position, margin_threshold, add_margin_percentage);

      reply.send({
        success: true,
        preview
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to calculate preview:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar execuções do Margin Guard
   */
  async getExecutions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const { status, limit = 50, offset = 0 } = request.query as any;

      const whereClause: any = {
        user_id: userId,
        type: 'margin_guard'
      };

      if (status) {
        whereClause.status = status;
      }

      const executions = await this.prisma.automation.findMany({
        where: whereClause,
        orderBy: { executed_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      reply.send({
        success: true,
        executions: executions.map(exec => ({
          id: exec.id,
          trade_id: exec.trade_id,
          status: exec.status,
          action: exec.action,
          trigger_data: exec.trigger_data,
          execution_result: exec.execution_result,
          error_message: exec.error_message,
          executed_at: exec.executed_at
        }))
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get executions:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar planos de upgrade disponíveis
   */
  async getAvailableUpgrades(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        reply.status(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      // Buscar planos superiores
      const availableUpgrades = await this.prisma.$queryRaw`
        SELECT * FROM plans 
        WHERE price > (
          SELECT price FROM plans p 
          JOIN users u ON u.plan_type = p.slug 
          WHERE u.id = ${userId}
        )
        ORDER BY price ASC
        LIMIT 3
      `;

      reply.send({
        success: true,
        current_plan: user.plan_type,
        available_upgrades: availableUpgrades
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get available upgrades:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar posições sendo monitoradas
   */
  async getMonitoredPositions(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const config = await this.prisma.marginGuardConfig.findUnique({
        where: { user_id: userId }
      });

      if (!config || !config.is_active) {
        reply.send({ success: true, monitored_positions: [] });
        return;
      }

      const positions = await this.fetchRunningPositions(userId);
      let monitoredPositions = [];

      if (config.mode === 'global') {
        monitoredPositions = positions;
      } else {
        monitoredPositions = positions.filter(pos => 
          config.selected_positions.includes(pos.trade_id)
        );
      }

      reply.send({
        success: true,
        monitored_positions: monitoredPositions.map(pos => ({
          trade_id: pos.trade_id,
          side: pos.side,
          entry_price: pos.entry_price,
          liquidation_price: pos.liquidation_price,
          current_price: pos.current_price,
          margin: pos.margin,
          distance_percentage: this.calculateDistancePercentage(
            pos.entry_price,
            pos.liquidation_price
          ),
          is_at_risk: this.isPositionAtRisk(pos, config.margin_threshold)
        }))
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get monitored positions:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Buscar estatísticas do Margin Guard
   */
  async getStatistics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      // Estatísticas de execução
      const totalExecutions = await this.prisma.automationExecutionLog.count({
        where: {
          user_id: userId,
          type: 'margin_guard'
        }
      });

      const successfulExecutions = await this.prisma.automationExecutionLog.count({
        where: {
          user_id: userId,
          type: 'margin_guard',
          status: 'success'
        }
      });

      const failedExecutions = await this.prisma.automationExecutionLog.count({
        where: {
          user_id: userId,
          type: 'margin_guard',
          status: 'error'
        }
      });

      // Margem total adicionada
      const executions = await this.prisma.automation.findMany({
        where: {
          user_id: userId,
          type: 'margin_guard',
          status: 'success'
        },
        select: { execution_result: true }
      });

      let totalMarginAdded = 0;
      executions.forEach(exec => {
        const result = exec.execution_result as any;
        if (result?.marginAdded) {
          totalMarginAdded += result.marginAdded;
        }
      });

      reply.send({
        success: true,
        statistics: {
          total_executions: totalExecutions,
          successful_executions: successfulExecutions,
          failed_executions: failedExecutions,
          success_rate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
          total_margin_added: totalMarginAdded
        }
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get statistics:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  // Métodos auxiliares privados

  private async fetchRunningPositions(userId: string): Promise<any[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        exchange_accounts: {
          where: { is_active: true },
          take: 1
        }
      }
    });

    if (!user || !user.exchange_accounts.length) {
      return [];
    }

    const account = user.exchange_accounts[0];
    const lnMarkets = new LNMarketsAPIv2({
      credentials: {
        apiKey: account.credentials['API Key'],
        apiSecret: account.credentials['API Secret'],
        passphrase: account.credentials['Passphrase'],
        isTestnet: false // TODO: Implementar detecção de testnet
      },
      logger: console as any
    });

    const positions = await lnMarkets.futures.getPositions();
    return positions.filter(pos => pos.quantity > 0); // Posições ativas têm quantidade > 0
  }

  private calculateDistancePercentage(entryPrice: number, liquidationPrice: number): number {
    const distance = Math.abs(entryPrice - liquidationPrice);
    return (distance / liquidationPrice) * 100;
  }

  private calculatePreview(position: any, marginThreshold: number, addMarginPercentage: number): any {
    const entryPrice = position.entry_price;
    const liquidationPrice = position.liquidation_price;
    const currentPrice = position.current_price;
    const currentMargin = position.margin;
    const side = position.side;

    // Calcular distância
    const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
    const distancePercentage = (distanceToLiquidation / liquidationPrice) * 100;
    
    // Calcular trigger price
    const activationDistance = distanceToLiquidation * (1 - marginThreshold / 100);
    const triggerPrice = side === 'b' 
      ? liquidationPrice + activationDistance
      : liquidationPrice - activationDistance;

    // Calcular margem
    const baseMargin = currentMargin * (addMarginPercentage / 100);
    const feeRatio = baseMargin / currentMargin;
    
    const fees = {
      opening_fee: position.fees.opening_fee * feeRatio,
      closing_fee: position.fees.closing_fee * feeRatio,
      maintenance_margin: position.fees.maintenance_margin * feeRatio,
      sum_carry_fees: position.fees.sum_carry_fees * feeRatio
    };
    
    const totalCost = baseMargin + fees.opening_fee + fees.closing_fee + 
                     fees.maintenance_margin + fees.sum_carry_fees;
    
    const newMargin = currentMargin + baseMargin;
    const newLiquidationPrice = this.calculateNewLiquidationPrice(entryPrice, newMargin, side);

    return {
      current_price: currentPrice,
      trigger_price: triggerPrice,
      distance_percentage: distancePercentage,
      margin_threshold: marginThreshold,
      margin_to_add: baseMargin,
      fees,
      total_cost: totalCost,
      new_margin: newMargin,
      new_liquidation_price: newLiquidationPrice,
      distance_improvement: this.calculateDistanceImprovement(
        distancePercentage,
        marginThreshold
      )
    };
  }

  private calculateNewLiquidationPrice(entryPrice: number, newMargin: number, side: string): number {
    const positionSize = 100000000; // 1 BTC em sats
    const marginPerUnit = newMargin / positionSize;
    
    return side === 'b' 
      ? entryPrice - marginPerUnit
      : entryPrice + marginPerUnit;
  }

  private calculateDistanceImprovement(currentDistance: number, threshold: number): number {
    return currentDistance - threshold;
  }

  private isPositionAtRisk(position: any, marginThreshold: number): boolean {
    const entryPrice = position.entry_price;
    const liquidationPrice = position.liquidation_price;
    const currentPrice = position.current_price;
    const side = position.side;

    const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
    const activationDistance = distanceToLiquidation * (1 - marginThreshold / 100);
    const triggerPrice = side === 'b' 
      ? liquidationPrice + activationDistance
      : liquidationPrice - activationDistance;

    return side === 'b' 
      ? currentPrice <= triggerPrice
      : currentPrice >= triggerPrice;
  }
}

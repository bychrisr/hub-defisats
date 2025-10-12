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
    console.log('🚀 MARGIN GUARD API - createOrUpdateConfig called');
    try {
      const userId = (request as any).user?.id;
      console.log('🔍 MARGIN GUARD API - User ID:', userId);
      
      if (!userId) {
        console.log('❌ MARGIN GUARD API - No user ID found');
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const requestBody = request.body as any;
      console.log('🔍 MARGIN GUARD API - Request body:', {
        mode: requestBody.mode,
        margin_threshold: requestBody.margin_threshold,
        add_margin_percentage: requestBody.add_margin_percentage,
        selected_positions: requestBody.selected_positions,
        is_active: requestBody.is_active
      });

      const {
        mode,
        margin_threshold,
        add_margin_percentage,
        selected_positions = [],
        is_active = true
      } = requestBody;

      // 1. Validar dados
      console.log('🔍 MARGIN GUARD API - Validating input data...');
      if (!mode || !margin_threshold || !add_margin_percentage) {
        console.log('❌ MARGIN GUARD API - Missing required fields:', {
          mode: !!mode,
          margin_threshold: !!margin_threshold,
          add_margin_percentage: !!add_margin_percentage
        });
        reply.status(400).send({ 
          error: 'Dados obrigatórios: mode, margin_threshold, add_margin_percentage' 
        });
        return;
      }

      if (!['unitario', 'global'].includes(mode)) {
        console.log('❌ MARGIN GUARD API - Invalid mode:', mode);
        reply.status(400).send({ error: 'Mode deve ser "unitario" ou "global"' });
        return;
      }

      if (margin_threshold < 5 || margin_threshold > 25) {
        console.log('❌ MARGIN GUARD API - Invalid margin_threshold:', margin_threshold);
        reply.status(400).send({ error: 'margin_threshold deve estar entre 5% e 25%' });
        return;
      }

      if (add_margin_percentage < 10 || add_margin_percentage > 100) {
        console.log('❌ MARGIN GUARD API - Invalid add_margin_percentage:', add_margin_percentage);
        reply.status(400).send({ error: 'add_margin_percentage deve estar entre 10% e 100%' });
        return;
      }

      console.log('✅ MARGIN GUARD API - Input validation passed');

      // 2. Validar limitações do plano
      console.log('🔍 MARGIN GUARD API - Validating plan limitations...');
      try {
        const planValidation = await this.planLimitsService.validateMarginGuardConfig({
          userId,
          mode,
          selectedPositions: selected_positions,
          marginThreshold: margin_threshold,
          addMarginPercentage: add_margin_percentage
        });

        console.log('🔍 MARGIN GUARD API - Plan validation result:', {
          isValid: planValidation.isValid,
          error: planValidation.error,
          hasLimitations: !!planValidation.limitations,
          hasUpgrades: !!planValidation.availableUpgrades
        });

        if (!planValidation.isValid) {
          console.log('❌ MARGIN GUARD API - Plan validation failed:', planValidation.error);
          reply.status(403).json({
            error: planValidation.error,
            limitations: planValidation.limitations,
            availableUpgrades: planValidation.availableUpgrades
          });
          return;
        }
        console.log('✅ MARGIN GUARD API - Plan validation passed');
      } catch (planError: any) {
        console.error('❌ MARGIN GUARD API - Plan validation error:', planError);
        throw planError;
      }

      // 3. Se modo unitário, validar posições selecionadas
      if (mode === 'unitario' && selected_positions.length > 0) {
        console.log('🔍 MARGIN GUARD API - Validating selected positions for unitario mode...');
        try {
          const positions = await this.fetchRunningPositions(userId);
          console.log('🔍 MARGIN GUARD API - Fetched positions:', positions.length);
          
          const validPositions = positions.map(p => p.trade_id);
          const invalidPositions = selected_positions.filter(id => !validPositions.includes(id));
          
          console.log('🔍 MARGIN GUARD API - Position validation:', {
            selectedPositions: selected_positions.length,
            validPositions: validPositions.length,
            invalidPositions: invalidPositions.length
          });
          
          if (invalidPositions.length > 0) {
            console.log('❌ MARGIN GUARD API - Invalid positions found:', invalidPositions);
            reply.status(400).send({ 
              error: `Posições inválidas: ${invalidPositions.join(', ')}` 
            });
            return;
          }
          console.log('✅ MARGIN GUARD API - Position validation passed');
        } catch (positionError: any) {
          console.error('❌ MARGIN GUARD API - Position validation error:', positionError);
          throw positionError;
        }
      }

      // 4. Criar ou atualizar configuração
      console.log('🔍 MARGIN GUARD API - Creating/updating configuration...');
      try {
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

        console.log('✅ MARGIN GUARD API - Configuration saved:', {
          configId: config.id,
          mode: config.mode,
          marginThreshold: config.margin_threshold,
          addMarginPercentage: config.add_margin_percentage,
          isActive: config.is_active
        });

        // 5. Atualizar worker se ativo
        if (is_active) {
          console.log('🔍 MARGIN GUARD API - Updating worker configuration...');
          try {
            const worker = getMarginGuardV2Worker(this.prisma);
            await worker.addConfiguration(config);
            console.log('✅ MARGIN GUARD API - Worker configuration updated');
          } catch (workerError: any) {
            console.error('❌ MARGIN GUARD API - Worker update error:', workerError);
            // Não falhar por causa do worker, apenas logar o erro
          }
        }

        console.log('✅ MARGIN GUARD API - Final configuration saved:', {
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
      } catch (dbError: any) {
        console.error('❌ MARGIN GUARD API - Database operation error:', dbError);
        throw dbError;
      }

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to create/update config:', error);
      console.error('❌ MARGIN GUARD API - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      });
      reply.status(500).send({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
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
        data: {
          positions: positions.map(pos => ({
            id: pos.trade_id || pos.id,
            symbol: pos.symbol || 'BTCUSD',
            side: pos.side,
            size: pos.size || pos.quantity,
            margin: pos.margin,
            liquidation_price: pos.liquidation_price,
            current_price: pos.current_price,
            entry_price: pos.entry_price,
            pnl: pos.pnl || 0,
            fees: pos.fees,
            distance_percentage: this.calculateDistancePercentage(
              pos.entry_price,
              pos.liquidation_price
            ),
            // Informações da conta (múltiplas contas)
            account_id: pos.account_id,
            account_name: pos.account_name,
            exchange_name: pos.exchange_name
          })),
          total: positions.length,
          accounts: [...new Set(positions.map(pos => pos.account_name))], // Lista de contas únicas
          closestToLiquidation: positions.reduce((closest, pos) => {
            const distance = this.calculateDistancePercentage(pos.entry_price, pos.liquidation_price);
            const closestDistance = this.calculateDistancePercentage(closest.entry_price, closest.liquidation_price);
            return distance < closestDistance ? pos : closest;
          }, positions[0]) || null
        }
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
        WHERE price_sats > (
          SELECT price_sats FROM plans p 
          JOIN "User" u ON u.plan_type::text = p.slug 
          WHERE u.id = ${userId}
        )
        ORDER BY price_sats ASC
        LIMIT 3
      `;

      reply.send({
        success: true,
        current_plan: user.plan_type,
        available_upgrades: availableUpgrades
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get available upgrades:', error);
      console.error('❌ MARGIN GUARD API - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      reply.status(500).send({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
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
    console.log('🔍 MARGIN GUARD - Fetching running positions for user:', userId);
    
    try {
      // Buscar TODAS as contas ativas do usuário (não apenas a primeira)
      const activeAccounts = await this.prisma.userExchangeAccounts.findMany({
        where: {
          user_id: userId,
          is_active: true,
          exchange: {
            slug: 'ln-markets' // Apenas LN Markets por enquanto
          }
        },
        include: {
          exchange: true
        }
      });

      console.log('🔍 MARGIN GUARD - Found active accounts:', {
        count: activeAccounts.length,
        accounts: activeAccounts.map(acc => ({
          id: acc.id,
          accountName: acc.account_name,
          exchangeName: acc.exchange.name
        }))
      });

    if (!activeAccounts.length) {
      console.log('⚠️ MARGIN GUARD - No active LN Markets accounts found');
      return [];
    }

    // Agregar posições de TODAS as contas ativas
    const allPositions: any[] = [];

    for (const account of activeAccounts) {
      try {
        console.log(`🔍 MARGIN GUARD - Processing account: ${account.account_name}`);
        
        // ✅ USAR LÓGICA AUTOMÁTICA EXISTENTE: O LNMarketsClient já detecta testnet automaticamente
        const lnMarkets = new LNMarketsAPIv2({
          credentials: {
            apiKey: account.credentials['API Key'],
            apiSecret: account.credentials['API Secret'],
            passphrase: account.credentials['Passphrase'],
            isTestnet: account.credentials.isTestnet === 'true' || account.credentials.testnet === 'true'
          },
          logger: console as any
        });

        const positions = await lnMarkets.futures.getPositions();
        const activePositions = positions.filter(pos => pos.quantity > 0);
        
        // Adicionar informação da conta às posições
        const positionsWithAccount = activePositions.map(pos => ({
          ...pos,
          account_id: account.id,
          account_name: account.account_name,
          exchange_name: account.exchange.name
        }));

        allPositions.push(...positionsWithAccount);
        
        console.log(`✅ MARGIN GUARD - Account ${account.account_name}: ${activePositions.length} active positions`);
        
      } catch (error) {
        console.error(`❌ MARGIN GUARD - Error fetching positions for account ${account.account_name}:`, error);
        // Continue com outras contas mesmo se uma falhar
      }
    }

      console.log(`✅ MARGIN GUARD - Total active positions across all accounts: ${allPositions.length}`);
      return allPositions;
    } catch (error: any) {
      console.error('❌ MARGIN GUARD - Error in fetchRunningPositions:', error);
      console.error('❌ MARGIN GUARD - Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      return []; // Retornar array vazio em caso de erro
    }
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

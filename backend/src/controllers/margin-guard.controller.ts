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
          
          // Buscar informações detalhadas do plano atual
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { plan_type: true }
          });
          
          const currentPlanFeatures = this.planLimitsService.getMarginGuardFeatures(user?.plan_type || 'basic');
          const availableUpgrades = await this.planLimitsService.getAvailableUpgrades(user?.plan_type || 'basic');
          
          reply.status(403).send({
            error: planValidation.error,
            limitations: planValidation.limitations,
            availableUpgrades: availableUpgrades,
            currentPlan: {
              type: user?.plan_type || 'basic',
              name: this.getPlanDisplayName(user?.plan_type || 'basic'),
              features: currentPlanFeatures
            },
            suggestion: availableUpgrades.length > 0 
              ? `Considere fazer upgrade para ${availableUpgrades[0]?.name || 'um plano superior'} para desbloquear esta funcionalidade`
              : 'Entre em contato com o suporte para mais informações'
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

      console.log('🔍 MARGIN GUARD API - Getting plan features for user:', userId);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        console.log('❌ MARGIN GUARD API - User not found:', userId);
        reply.status(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      console.log('🔍 MARGIN GUARD API - User plan type:', user.plan_type);
      console.log('🔍 MARGIN GUARD API - User plan type (raw):', JSON.stringify(user.plan_type));
      console.log('🔍 MARGIN GUARD API - Plan type check:', {
        isLifetime: user.plan_type === 'lifetime',
        type: typeof user.plan_type,
        length: user.plan_type?.length
      });

      const planFeatures = this.planLimitsService.getMarginGuardFeatures(user.plan_type);
      const availableUpgrades = await this.planLimitsService.getAvailableUpgrades(user.plan_type);

      console.log('✅ MARGIN GUARD API - Plan features retrieved:', {
        planType: user.plan_type,
        features: planFeatures,
        upgradesAvailable: availableUpgrades.length,
        planDisplayName: this.getPlanDisplayName(user.plan_type)
      });

      reply.send({
        success: true,
        plan_type: user.plan_type,
        features: planFeatures,
        available_upgrades: availableUpgrades,
        limitations: planFeatures.limitations,
        // Informações adicionais para UI
        plan_info: {
          name: this.getPlanDisplayName(user.plan_type),
          description: this.getPlanDescription(user.plan_type),
          max_positions: planFeatures.maxPositions,
          supported_modes: planFeatures.modes,
          available_features: planFeatures.features
        }
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get plan features:', error);
      reply.status(500).send({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Get plan display name
   */
  private getPlanDisplayName(planType: string): string {
    // Normalizar o tipo de plano (trim, lowercase)
    const normalizedPlanType = (planType || '').toString().trim().toLowerCase();
    
    console.log('🔍 PLAN DISPLAY NAME - Input:', {
      original: planType,
      normalized: normalizedPlanType,
      type: typeof planType
    });

    const names = {
      'free': 'Gratuito',
      'basic': 'Básico',
      'advanced': 'Avançado',
      'pro': 'Profissional',
      'lifetime': 'Vitalício'
    };
    
    const result = names[normalizedPlanType as keyof typeof names] || 'Desconhecido';
    
    console.log('✅ PLAN DISPLAY NAME - Result:', {
      input: normalizedPlanType,
      found: !!names[normalizedPlanType as keyof typeof names],
      result
    });
    
    return result;
  }

  /**
   * Get plan description
   */
  private getPlanDescription(planType: string): string {
    // Normalizar o tipo de plano (trim, lowercase)
    const normalizedPlanType = (planType || '').toString().trim().toLowerCase();
    
    const descriptions = {
      'free': 'Margin Guard básico para até 2 posições',
      'basic': 'Margin Guard para todas as posições (modo global)',
      'advanced': 'Margin Guard completo com modo unitário',
      'pro': 'Margin Guard profissional com configurações individuais',
      'lifetime': 'Margin Guard vitalício com todas as funcionalidades'
    };
    return descriptions[normalizedPlanType as keyof typeof descriptions] || 'Plano não identificado';
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
    const quantity = position.quantity || 0; // Quantidade da posição em BTC

    // Calcular distância
    const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
    const distancePercentage = (distanceToLiquidation / liquidationPrice) * 100;
    
    // Calcular trigger price
    const activationDistance = distanceToLiquidation * (1 - marginThreshold / 100);
    const triggerPrice = side === 'b' 
      ? liquidationPrice + activationDistance
      : liquidationPrice - activationDistance;

    // Calcular margem base a ser adicionada
    const baseMargin = currentMargin * (addMarginPercentage / 100);
    
    // ✅ CÁLCULO CORRETO BASEADO NA DOCUMENTAÇÃO LN MARKETS
    // Taxa de negociação baseada no nível do usuário (assumindo Tier 1 = 0.1%)
    const tradingFeeRate = 0.001; // 0.1% conforme documentação oficial
    
    // Cálculo das taxas baseado na documentação oficial:
    // - Taxa de abertura reservada = (Quantidade / Preço de entrada) × Taxa do nível 1
    // - Taxa de fechamento reservada = (Quantidade / Preço de liquidação inicial) × Taxa do nível 1
    
    const positionValueBTC = quantity; // Quantidade já em BTC
    const positionValueUSD = positionValueBTC * entryPrice; // Valor em USD
    
    // Taxas proporcionais à margem adicionada (não à posição total)
    const marginRatio = baseMargin / currentMargin;
    
    const fees = {
      // Taxa de abertura proporcional à margem adicionada
      opening_fee: (positionValueUSD / entryPrice) * tradingFeeRate * marginRatio * 100000000, // Convertido para sats
      // Taxa de fechamento proporcional à margem adicionada  
      closing_fee: (positionValueUSD / liquidationPrice) * tradingFeeRate * marginRatio * 100000000, // Convertido para sats
      // Maintenance margin (reservado para taxas futuras)
      maintenance_margin: baseMargin * 0.002, // 0.2% da margem adicionada
      // Carry fees (taxas de financiamento acumuladas)
      sum_carry_fees: position.sum_carry_fees * marginRatio || 0
    };
    
    // Custo total = margem base + taxas
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
      ),
      // Informações adicionais para transparência
      position_info: {
        quantity_btc: quantity,
        position_value_usd: positionValueUSD,
        margin_ratio: marginRatio,
        trading_fee_rate: tradingFeeRate
      }
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

  /**
   * Buscar notificações do Margin Guard
   */
  async getNotifications(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    console.log('🔔 MARGIN GUARD API - Getting notifications');
    try {
      const userId = (request as any).user?.id;
      
      if (!userId) {
        console.log('❌ MARGIN GUARD API - No user ID found');
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const queryParams = request.query as any;
      const limit = parseInt(queryParams.limit) || 50;

      // Buscar notificações usando NotificationCentralService
      const { NotificationCentralService } = await import('../services/notification-central.service');
      const notificationService = new NotificationCentralService(this.prisma);
      const notifications = await notificationService.getInAppNotifications(userId, limit, false);

      console.log('✅ MARGIN GUARD API - Notifications retrieved:', {
        userId,
        count: notifications.length
      });

      reply.send({
        success: true,
        notifications,
        count: notifications.length
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get notifications:', error);
      reply.status(500).send({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markNotificationAsRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    console.log('🔔 MARGIN GUARD API - Marking notification as read');
    try {
      const userId = (request as any).user?.id;
      const { notificationId } = request.params as any;
      
      if (!userId) {
        console.log('❌ MARGIN GUARD API - No user ID found');
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      if (!notificationId) {
        console.log('❌ MARGIN GUARD API - No notification ID provided');
        reply.status(400).send({ error: 'ID da notificação é obrigatório' });
        return;
      }

      // Marcar notificação como lida usando Prisma diretamente
      const updated = await this.prisma.inAppNotification.update({
        where: { 
          id: notificationId,
          user_id: userId // Garantir que é do usuário
        },
        data: { read: true }
      });
      
      const success = !!updated;

      if (success) {
        console.log('✅ MARGIN GUARD API - Notification marked as read:', notificationId);
        reply.send({
          success: true,
          message: 'Notificação marcada como lida'
        });
      } else {
        console.log('❌ MARGIN GUARD API - Failed to mark notification as read');
        reply.status(500).send({ 
          error: 'Erro ao marcar notificação como lida'
        });
      }

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to mark notification as read:', error);
      reply.status(500).send({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  }

  /**
   * Test notification endpoint
   */
  async testNotification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const userId = (request as any).user?.id;
      
      if (!userId) {
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      const body = request.body as any;
      
      // Validar dados da notificação de teste
      if (!body.type || !body.title || !body.message) {
        reply.status(400).send({ 
          error: 'Dados de notificação inválidos. Requer: type, title, message' 
        });
        return;
      }

      // Usar o NotificationCentralService existente
      const { NotificationCentralService } = await import('../services/notification-central.service');
      const notificationService = new NotificationCentralService(this.prisma);

      await notificationService.notify({
        userId,
        type: body.type || 'margin_guard',
        priority: body.priority || 'medium',
        title: body.title,
        message: body.message,
        metadata: body.metadata || {}
      });

      console.log('✅ MARGIN GUARD API - Test notification sent successfully');

      reply.send({
        success: true,
        message: 'Notificação de teste enviada com sucesso',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to send test notification:', error);
      reply.status(500).send({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  }

  /**
   * Obter estatísticas de notificações
   */
  async getNotificationStats(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    console.log('📊 MARGIN GUARD API - Getting notification stats');
    try {
      const userId = (request as any).user?.id;
      
      if (!userId) {
        console.log('❌ MARGIN GUARD API - No user ID found');
        reply.status(401).send({ error: 'Usuário não autenticado' });
        return;
      }

      // Buscar estatísticas de notificações usando NotificationCentralService
      const { NotificationCentralService } = await import('../services/notification-central.service');
      const notificationService = new NotificationCentralService(this.prisma);
      
      const notifications = await notificationService.getInAppNotifications(userId, 100, false);
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byType: notifications.reduce((acc, notif) => {
          acc[notif.type] = (acc[notif.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recent: notifications.slice(0, 5)
      };

      console.log('✅ MARGIN GUARD API - Notification stats retrieved:', stats);

      reply.send({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('❌ MARGIN GUARD API - Failed to get notification stats:', error);
      reply.status(500).send({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  }
}

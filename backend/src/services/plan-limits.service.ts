import { PrismaClient } from '@prisma/client';

export interface MarginGuardConfigRequest {
  userId: string;
  mode: 'unitario' | 'global';
  selectedPositions: string[];
  marginThreshold: number;
  addMarginPercentage: number;
}

export interface PlanValidationResult {
  isValid: boolean;
  error?: string;
  limitations?: any;
  availableUpgrades?: any[];
}

export interface MarginGuardFeatures {
  maxPositions: number;
  modes: string[];
  features: string[];
  limitations: string[];
}

export class PlanLimitsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Obter features do Margin Guard por plano
   */
  getMarginGuardFeatures(planType: string): MarginGuardFeatures {
    const planLimits = {
      'free': {
        maxPositions: 2,
        modes: ['global'],
        features: ['basic_config', 'preview'],
        limitations: [
          'Máximo 2 posições monitoradas',
          'Apenas modo global',
          'Configurações básicas'
        ]
      },
      'basic': {
        maxPositions: -1, // ilimitado
        modes: ['global'],
        features: ['basic_config', 'preview', 'reports'],
        limitations: [
          'Apenas modo global',
          'Configurações padrão'
        ]
      },
      'advanced': {
        maxPositions: -1,
        modes: ['unitario', 'global'],
        features: ['advanced_config', 'preview', 'reports', 'statistics'],
        limitations: [
          'Configurações avançadas',
          'Modo unitário disponível'
        ]
      },
      'pro': {
        maxPositions: -1,
        modes: ['unitario', 'global', 'individual'],
        features: ['all_features', 'priority_support'],
        limitations: []
      },
      'lifetime': {
        maxPositions: -1,
        modes: ['unitario', 'global', 'individual'],
        features: ['all_features', 'priority_support', 'custom_configs'],
        limitations: []
      }
    };

    return planLimits[planType as keyof typeof planLimits] || planLimits.free;
  }

  /**
   * Validar configuração do Margin Guard
   */
  async validateMarginGuardConfig(config: MarginGuardConfigRequest): Promise<PlanValidationResult> {
    try {
      // 1. Buscar plano do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: config.userId },
        select: { plan_type: true }
      });

      if (!user) {
        return {
          isValid: false,
          error: 'Usuário não encontrado'
        };
      }

      const planFeatures = this.getMarginGuardFeatures(user.plan_type);

      // 2. Validar modo
      if (!planFeatures.modes.includes(config.mode)) {
        return {
          isValid: false,
          error: `Modo ${config.mode} não disponível no plano ${user.plan_type}`,
          limitations: planFeatures.limitations,
          availableUpgrades: await this.getAvailableUpgrades(user.plan_type)
        };
      }

      // 3. Validar número de posições (se modo unitário)
      if (config.mode === 'unitario' && planFeatures.maxPositions > 0) {
        if (config.selectedPositions.length > planFeatures.maxPositions) {
          return {
            isValid: false,
            error: `Máximo ${planFeatures.maxPositions} posições no plano ${user.plan_type}`,
            limitations: planFeatures.limitations,
            availableUpgrades: await this.getAvailableUpgrades(user.plan_type)
          };
        }
      }

      // 4. Validar threshold mínimo por plano
      const minThreshold = this.getMinThresholdByPlan(user.plan_type);
      if (config.marginThreshold < minThreshold) {
        return {
          isValid: false,
          error: `Threshold mínimo ${minThreshold}% no plano ${user.plan_type}`,
          limitations: planFeatures.limitations,
          availableUpgrades: await this.getAvailableUpgrades(user.plan_type)
        };
      }

      // 5. Validar porcentagem de margem por plano
      const maxMarginPercentage = this.getMaxMarginPercentageByPlan(user.plan_type);
      if (config.addMarginPercentage > maxMarginPercentage) {
      return {
          isValid: false,
          error: `Máximo ${maxMarginPercentage}% de margem no plano ${user.plan_type}`,
          limitations: planFeatures.limitations,
          availableUpgrades: await this.getAvailableUpgrades(user.plan_type)
        };
      }

      return { isValid: true };

    } catch (error: any) {
      console.error('❌ PLAN LIMITS - Validation error:', error);
      return {
        isValid: false,
        error: 'Erro interno na validação'
      };
    }
  }

  /**
   * Buscar planos de upgrade disponíveis
   */
  async getAvailableUpgrades(currentPlan: string): Promise<any[]> {
    try {
      // Buscar planos superiores
      const upgrades = await this.prisma.$queryRaw`
        SELECT 
          slug,
          name,
          price_sats,
          features
        FROM plans 
        WHERE price_sats > (
          SELECT price_sats FROM plans p 
          WHERE p.slug = ${currentPlan}
        )
        ORDER BY price_sats ASC
        LIMIT 3
      `;

      return upgrades as any[];

    } catch (error: any) {
      console.error('❌ PLAN LIMITS - Failed to get upgrades:', error);
      return [];
    }
  }

  /**
   * Obter threshold mínimo por plano
   */
  private getMinThresholdByPlan(planType: string): number {
    const thresholds = {
      'free': 15,      // 15% mínimo
      'basic': 10,     // 10% mínimo
      'advanced': 5,   // 5% mínimo
      'pro': 5,        // 5% mínimo
      'lifetime': 5    // 5% mínimo
    };

    return thresholds[planType as keyof typeof thresholds] || 15;
  }

  /**
   * Obter porcentagem máxima de margem por plano
   */
  private getMaxMarginPercentageByPlan(planType: string): number {
    const percentages = {
      'free': 50,      // 50% máximo
      'basic': 75,     // 75% máximo
      'advanced': 100, // 100% máximo
      'pro': 100,      // 100% máximo
      'lifetime': 100  // 100% máximo
    };

    return percentages[planType as keyof typeof percentages] || 50;
  }

  /**
   * Verificar se usuário pode usar feature específica
   */
  async canUseFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) return false;

      const features = this.getMarginGuardFeatures(user.plan_type);
      return features.features.includes(feature);

    } catch (error: any) {
      console.error('❌ PLAN LIMITS - Failed to check feature access:', error);
      return false;
    }
  }

  /**
   * Obter limitações específicas do plano
   */
  async getPlanLimitations(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        return { error: 'Usuário não encontrado' };
      }

      const features = this.getMarginGuardFeatures(user.plan_type);
      const upgrades = await this.getAvailableUpgrades(user.plan_type);

      return {
        current_plan: user.plan_type,
        features: features,
        available_upgrades: upgrades,
        limitations: features.limitations
      };

    } catch (error: any) {
      console.error('❌ PLAN LIMITS - Failed to get plan limitations:', error);
      return { error: 'Erro interno' };
    }
  }

  /**
   * Validar upgrade de plano
   */
  async validatePlanUpgrade(userId: string, targetPlan: string): Promise<{
    isValid: boolean;
    error?: string;
    upgradeInfo?: any;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { plan_type: true }
      });

      if (!user) {
        return { isValid: false, error: 'Usuário não encontrado' };
      }

      // Buscar informações do plano alvo
      const targetPlanInfo = await this.prisma.$queryRaw`
        SELECT * FROM plans WHERE slug = ${targetPlan}
      ` as any[];

      if (!targetPlanInfo.length) {
        return { isValid: false, error: 'Plano não encontrado' };
      }

      const currentPlanInfo = await this.prisma.$queryRaw`
        SELECT * FROM plans WHERE slug = ${user.plan_type}
      ` as any[];

      if (!currentPlanInfo.length) {
        return { isValid: false, error: 'Plano atual não encontrado' };
      }

      const target = targetPlanInfo[0];
      const current = currentPlanInfo[0];

      // Verificar se é um upgrade válido
      if (target.price <= current.price) {
        return { isValid: false, error: 'Não é um upgrade válido' };
      }

      return {
        isValid: true,
        upgradeInfo: {
          from: current,
          to: target,
          priceDifference: target.price - current.price,
          newFeatures: this.getMarginGuardFeatures(targetPlan)
        }
      };

    } catch (error: any) {
      console.error('❌ PLAN LIMITS - Failed to validate upgrade:', error);
      return { isValid: false, error: 'Erro interno' };
    }
  }
}
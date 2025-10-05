import { getPrisma } from '../lib/prisma';

export interface PlanLimits {
  id: string;
  planId: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
  createdAt: Date;
  updatedAt: Date;
  plan: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreatePlanLimitsRequest {
  planId: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
}

export interface UpdatePlanLimitsRequest {
  id: string;
  maxExchangeAccounts?: number;
  maxAutomations?: number;
  maxIndicators?: number;
  maxSimulations?: number;
  maxBacktests?: number;
}

export interface LimitValidationResult {
  isValid: boolean;
  currentCount: number;
  maxLimit: number;
  limitType: string;
  message?: string;
}

export class PlanLimitsService {
  private async getPrisma() {
    return await getPrisma();
  }

  /**
   * Criar limites para um plano
   */
  async createPlanLimits(data: CreatePlanLimitsRequest): Promise<PlanLimits> {
    try {
      // Verificar se o plano existe
      const prisma = await this.getPrisma();
      const plan = await prisma.plan.findUnique({
        where: { id: data.planId }
      });

      if (!plan) {
        throw new Error('Plan not found');
      }

      // Verificar se já existem limites para este plano
      const existingLimits = await prisma.planLimits.findUnique({
        where: { plan_id: data.planId }
      });

      if (existingLimits) {
        throw new Error('Plan limits already exist for this plan');
      }

      const planLimits = await prisma.planLimits.create({
        data: {
          plan_id: data.planId,
          max_exchange_accounts: data.maxExchangeAccounts,
          max_automations: data.maxAutomations,
          max_indicators: data.maxIndicators,
          max_simulations: data.maxSimulations,
          max_backtests: data.maxBacktests
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      console.log(`✅ PlanLimitsService - Created limits for plan: ${plan.name}`);
      return {
        id: planLimits.id,
        planId: planLimits.plan_id,
        maxExchangeAccounts: planLimits.max_exchange_accounts,
        maxAutomations: planLimits.max_automations,
        maxIndicators: planLimits.max_indicators,
        maxSimulations: planLimits.max_simulations,
        maxBacktests: planLimits.max_backtests,
        createdAt: planLimits.created_at,
        updatedAt: planLimits.updated_at,
        plan: planLimits.plan
      };

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error creating plan limits:', error);
      throw new Error(`Failed to create plan limits: ${error.message}`);
    }
  }

  /**
   * Atualizar limites de um plano
   */
  async updatePlanLimits(data: UpdatePlanLimitsRequest): Promise<PlanLimits> {
    try {
      const prisma = await this.getPrisma();
      const planLimits = await prisma.planLimits.update({
        where: { id: data.id },
        data: {
          max_exchange_accounts: data.maxExchangeAccounts,
          max_automations: data.maxAutomations,
          max_indicators: data.maxIndicators,
          max_simulations: data.maxSimulations,
          max_backtests: data.maxBacktests,
          updated_at: new Date()
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      console.log(`✅ PlanLimitsService - Updated limits for plan: ${planLimits.plan.name}`);
      return {
        id: planLimits.id,
        planId: planLimits.plan_id,
        maxExchangeAccounts: planLimits.max_exchange_accounts,
        maxAutomations: planLimits.max_automations,
        maxIndicators: planLimits.max_indicators,
        maxSimulations: planLimits.max_simulations,
        maxBacktests: planLimits.max_backtests,
        createdAt: planLimits.created_at,
        updatedAt: planLimits.updated_at,
        plan: planLimits.plan
      };

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error updating plan limits:', error);
      throw new Error(`Failed to update plan limits: ${error.message}`);
    }
  }

  /**
   * Obter limites de um plano
   */
  async getPlanLimits(planId: string): Promise<PlanLimits | null> {
    try {
      const prisma = await this.getPrisma();
      const planLimits = await prisma.planLimits.findUnique({
        where: { plan_id: planId },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      if (!planLimits) return null;
      
      return {
        id: planLimits.id,
        planId: planLimits.plan_id,
        maxExchangeAccounts: planLimits.max_exchange_accounts,
        maxAutomations: planLimits.max_automations,
        maxIndicators: planLimits.max_indicators,
        maxSimulations: planLimits.max_simulations,
        maxBacktests: planLimits.max_backtests,
        createdAt: planLimits.created_at,
        updatedAt: planLimits.updated_at,
        plan: planLimits.plan
      };

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error getting plan limits:', error);
      throw new Error(`Failed to get plan limits: ${error.message}`);
    }
  }

  /**
   * Listar todos os limites de planos
   */
  async getAllPlanLimits(): Promise<PlanLimits[]> {
    try {
      const prisma = await this.getPrisma();
      const planLimits = await prisma.planLimits.findMany({
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: {
          plan: {
            name: 'asc'
          }
        }
      });

      console.log(`✅ PlanLimitsService - Retrieved ${planLimits.length} plan limits`);
      return planLimits.map(pl => ({
        id: pl.id,
        planId: pl.plan_id,
        maxExchangeAccounts: pl.max_exchange_accounts,
        maxAutomations: pl.max_automations,
        maxIndicators: pl.max_indicators,
        maxSimulations: pl.max_simulations,
        maxBacktests: pl.max_backtests,
        createdAt: pl.created_at,
        updatedAt: pl.updated_at,
        plan: pl.plan
      }));

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error getting all plan limits:', error);
      throw new Error(`Failed to get all plan limits: ${error.message}`);
    }
  }

  /**
   * Obter limites de um usuário
   */
  async getUserLimits(userId: string): Promise<PlanLimits | null> {
    try {
      const prisma = await this.getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan_type: true
        }
      });

      if (!user) {
        console.log(`⚠️ PlanLimitsService - User not found: ${userId}`);
        return null;
      }

      // Buscar limites do plano do usuário
      const planLimits = await prisma.planLimits.findFirst({
        where: {
          plan: {
            slug: user.plan_type.toLowerCase()
          }
        },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      });

      if (!planLimits) {
        console.log(`⚠️ PlanLimitsService - No limits found for user plan: ${user.plan_type}`);
        return null;
      }

      return {
        id: planLimits.id,
        planId: planLimits.plan_id,
        maxExchangeAccounts: planLimits.max_exchange_accounts,
        maxAutomations: planLimits.max_automations,
        maxIndicators: planLimits.max_indicators,
        maxSimulations: planLimits.max_simulations,
        maxBacktests: planLimits.max_backtests,
        createdAt: planLimits.created_at,
        updatedAt: planLimits.updated_at,
        plan: planLimits.plan
      };

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error getting user limits:', error);
      throw new Error(`Failed to get user limits: ${error.message}`);
    }
  }

  /**
   * Validar limite específico
   */
  async validateLimit(
    userId: string,
    limitType: 'EXCHANGE_ACCOUNTS' | 'AUTOMATIONS' | 'INDICATORS' | 'SIMULATIONS' | 'BACKTESTS'
  ): Promise<LimitValidationResult> {
    try {
      const limits = await this.getUserLimits(userId);
      
      if (!limits) {
        return {
          isValid: false,
          currentCount: 0,
          maxLimit: 0,
          limitType,
          message: 'No plan limits found'
        };
      }

      // Obter contagem atual
      const prisma = await this.getPrisma();
      let currentCount = 0;
      switch (limitType) {
        case 'EXCHANGE_ACCOUNTS':
          currentCount = await prisma.userExchangeAccounts.count({
            where: { user_id: userId }
          });
          break;
        case 'AUTOMATIONS':
          currentCount = await prisma.automation.count({
            where: { user_id: userId }
          });
          break;
        case 'INDICATORS':
          // Implementar contagem de indicadores quando necessário
          currentCount = 0;
          break;
        case 'SIMULATIONS':
          currentCount = await prisma.simulation.count({
            where: { user_id: userId }
          });
          break;
        case 'BACKTESTS':
          currentCount = await prisma.backtestReport.count({
            where: { user_id: userId }
          });
          break;
      }

      const maxLimit = this.getLimitByType(limits, limitType);
      const isValid = currentCount < maxLimit;

      return {
        isValid,
        currentCount,
        maxLimit,
        limitType,
        message: isValid ? undefined : `Limit exceeded for ${limitType}`
      };

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error validating limit:', error);
      return {
        isValid: false,
        currentCount: 0,
        maxLimit: 0,
        limitType,
        message: `Error validating limit: ${error.message}`
      };
    }
  }

  /**
   * Obter limite por tipo
   */
  private getLimitByType(limits: PlanLimits, type: string): number {
    switch (type) {
      case 'EXCHANGE_ACCOUNTS':
        return limits.maxExchangeAccounts;
      case 'AUTOMATIONS':
        return limits.maxAutomations;
      case 'INDICATORS':
        return limits.maxIndicators;
      case 'SIMULATIONS':
        return limits.maxSimulations;
      case 'BACKTESTS':
        return limits.maxBacktests;
      default:
        return 0;
    }
  }

  /**
   * Deletar limites de um plano
   */
  async deletePlanLimits(id: string): Promise<void> {
    try {
      const prisma = await this.getPrisma();
      await prisma.planLimits.delete({
        where: { id }
      });

      console.log(`✅ PlanLimitsService - Deleted plan limits: ${id}`);

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error deleting plan limits:', error);
      throw new Error(`Failed to delete plan limits: ${error.message}`);
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStatistics(): Promise<{
    totalPlans: number;
    plansWithLimits: number;
    averageLimits: {
      exchangeAccounts: number;
      automations: number;
      indicators: number;
      simulations: number;
      backtests: number;
    };
  }> {
    try {
      const prisma = await this.getPrisma();
      const totalPlans = await prisma.plan.count();
      const plansWithLimits = await prisma.planLimits.count();
      
      console.log('📊 Statistics - Total plans:', totalPlans);
      console.log('📊 Statistics - Plans with limits:', plansWithLimits);
      
      const limits = await prisma.planLimits.findMany();
      console.log('📊 Statistics - Limits found:', limits.length);
      
      const averageLimits = {
        exchangeAccounts: limits.length > 0 ? limits.reduce((sum, l) => sum + l.max_exchange_accounts, 0) / limits.length : 0,
        automations: limits.length > 0 ? limits.reduce((sum, l) => sum + l.max_automations, 0) / limits.length : 0,
        indicators: limits.length > 0 ? limits.reduce((sum, l) => sum + l.max_indicators, 0) / limits.length : 0,
        simulations: limits.length > 0 ? limits.reduce((sum, l) => sum + l.max_simulations, 0) / limits.length : 0,
        backtests: limits.length > 0 ? limits.reduce((sum, l) => sum + l.max_backtests, 0) / limits.length : 0
      };

      console.log('📊 Statistics - Average limits:', averageLimits);

      const result = {
        totalPlans,
        plansWithLimits,
        averageLimits
      };

      console.log('📊 Statistics - Final result:', result);
      return result;

    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error getting usage statistics:', error);
      throw new Error(`Failed to get usage statistics: ${error.message}`);
    }
  }
}

export const planLimitsService = new PlanLimitsService();

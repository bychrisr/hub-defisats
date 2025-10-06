import { PrismaClient, PlanLimits, Plan } from '@prisma/client';

export interface PlanLimitsWithPlan extends PlanLimits {
  plan: Plan;
}

export class PlanLimitsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get plan limits by plan type
   */
  async getPlanLimitsByType(planType: string): Promise<PlanLimitsWithPlan | null> {
    console.log('🔍 PLAN LIMITS SERVICE - Getting limits for plan type:', planType);
    
    try {
      const planLimits = await this.prisma.planLimits.findFirst({
        where: {
          plan: {
            slug: planType
          }
        },
        include: {
          plan: true
        }
      });

      if (planLimits) {
        console.log('✅ PLAN LIMITS SERVICE - Plan limits found:', {
          planType: planLimits.plan.slug,
          maxExchangeAccounts: planLimits.max_exchange_accounts,
          maxAutomations: planLimits.max_automations,
          maxIndicators: planLimits.max_indicators
        });
      } else {
        console.log('❌ PLAN LIMITS SERVICE - No plan limits found for type:', planType);
      }

      return planLimits;
    } catch (error: any) {
      console.error('❌ PLAN LIMITS SERVICE - Error getting plan limits:', error);
      throw error;
    }
  }

  /**
   * Get plan limits by plan ID
   */
  async getPlanLimitsById(planId: string): Promise<PlanLimitsWithPlan | null> {
    console.log('🔍 PLAN LIMITS SERVICE - Getting limits for plan ID:', planId);
    
    try {
      const planLimits = await this.prisma.planLimits.findUnique({
        where: {
          plan_id: planId
        },
        include: {
          plan: true
        }
      });

      if (planLimits) {
        console.log('✅ PLAN LIMITS SERVICE - Plan limits found:', {
          planId: planLimits.plan.id,
          planType: planLimits.plan.slug,
          maxExchangeAccounts: planLimits.max_exchange_accounts,
          maxAutomations: planLimits.max_automations,
          maxIndicators: planLimits.max_indicators
        });
      } else {
        console.log('❌ PLAN LIMITS SERVICE - No plan limits found for ID:', planId);
      }

      return planLimits;
    } catch (error: any) {
      console.error('❌ PLAN LIMITS SERVICE - Error getting plan limits:', error);
      throw error;
    }
  }

  /**
   * Get all plan limits
   */
  async getAllPlanLimits(): Promise<PlanLimitsWithPlan[]> {
    console.log('🔍 PLAN LIMITS SERVICE - Getting all plan limits');
    
    try {
      const planLimits = await this.prisma.planLimits.findMany({
        include: {
          plan: true
        },
        orderBy: {
          plan: {
            sort_order: 'asc'
          }
        }
      });

      console.log('✅ PLAN LIMITS SERVICE - All plan limits found:', {
        count: planLimits.length,
        plans: planLimits.map(pl => ({
          planType: pl.plan.slug,
          maxExchangeAccounts: pl.max_exchange_accounts,
          maxAutomations: pl.max_automations
        }))
      });

      return planLimits;
    } catch (error: any) {
      console.error('❌ PLAN LIMITS SERVICE - Error getting all plan limits:', error);
      throw error;
    }
  }

  /**
   * Update plan limits
   */
  async updatePlanLimits(
    planId: string, 
    limits: {
      max_exchange_accounts?: number;
      max_automations?: number;
      max_indicators?: number;
      max_simulations?: number;
      max_backtests?: number;
    }
  ): Promise<PlanLimitsWithPlan> {
    console.log('🔄 PLAN LIMITS SERVICE - Updating plan limits:', { planId, limits });
    
    try {
      const updatedLimits = await this.prisma.planLimits.update({
        where: {
          plan_id: planId
        },
        data: {
          ...limits,
          updated_at: new Date()
        },
        include: {
          plan: true
        }
      });

      console.log('✅ PLAN LIMITS SERVICE - Plan limits updated:', {
        planType: updatedLimits.plan.slug,
        maxExchangeAccounts: updatedLimits.max_exchange_accounts,
        maxAutomations: updatedLimits.max_automations,
        maxIndicators: updatedLimits.max_indicators
      });

      return updatedLimits;
    } catch (error: any) {
      console.error('❌ PLAN LIMITS SERVICE - Error updating plan limits:', error);
      throw error;
    }
  }

  /**
   * Get default limits for a plan type (fallback)
   */
  getDefaultLimits(planType: string): { max_exchange_accounts: number; is_unlimited: boolean } {
    const defaultLimits: Record<string, { max_exchange_accounts: number; is_unlimited: boolean }> = {
      'free': { max_exchange_accounts: 1, is_unlimited: false },
      'basic': { max_exchange_accounts: 2, is_unlimited: false },
      'advanced': { max_exchange_accounts: 5, is_unlimited: false },
      'pro': { max_exchange_accounts: 10, is_unlimited: false },
      'lifetime': { max_exchange_accounts: 0, is_unlimited: true }
    };

    return defaultLimits[planType] || { max_exchange_accounts: 1, is_unlimited: false };
  }
}

import { api } from '@/lib/api';

export interface PlanLimits {
  plan_type: string;
  max_exchange_accounts: number;
  max_automations?: number;
  max_indicators?: number;
  max_simulations?: number;
  max_backtests?: number;
  is_unlimited: boolean;
  is_default?: boolean;
}

export class PlanLimitsService {
  /**
   * Get plan limits by plan type
   */
  static async getPlanLimits(planType: string): Promise<PlanLimits> {
    console.log('🔍 PLAN LIMITS SERVICE - Fetching limits for plan:', planType);
    
    try {
      const response = await api.get(`/api/plan-limits/${planType}`);
      
      if (response.data.success) {
        console.log('✅ PLAN LIMITS SERVICE - Limits fetched:', {
          planType: response.data.data.plan_type,
          maxExchangeAccounts: response.data.data.max_exchange_accounts,
          isUnlimited: response.data.data.is_unlimited
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch plan limits');
      }
    } catch (error: any) {
      console.error('❌ PLAN LIMITS SERVICE - Error fetching plan limits:', error);
      throw error;
    }
  }

  /**
   * Get all plan limits
   */
  static async getAllPlanLimits(): Promise<PlanLimits[]> {
    console.log('🔍 PLAN LIMITS SERVICE - Fetching all plan limits');
    
    try {
      const response = await api.get('/api/plan-limits');
      
      if (response.data.success) {
        console.log('✅ PLAN LIMITS SERVICE - All limits fetched:', {
          count: response.data.data.length,
          plans: response.data.data.map((pl: any) => ({
            planType: pl.plan_type,
            maxExchangeAccounts: pl.max_exchange_accounts,
            isUnlimited: pl.is_unlimited
          }))
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch plan limits');
      }
    } catch (error: any) {
      console.error('❌ PLAN LIMITS SERVICE - Error fetching all plan limits:', error);
      throw error;
    }
  }

  /**
   * Get default limits for a plan type (fallback)
   */
  static getDefaultLimits(planType: string): PlanLimits {
    const defaultLimits: Record<string, PlanLimits> = {
      'free': { 
        plan_type: 'free', 
        max_exchange_accounts: 1, 
        is_unlimited: false,
        is_default: true
      },
      'basic': { 
        plan_type: 'basic', 
        max_exchange_accounts: 2, 
        is_unlimited: false,
        is_default: true
      },
      'advanced': { 
        plan_type: 'advanced', 
        max_exchange_accounts: 5, 
        is_unlimited: false,
        is_default: true
      },
      'pro': { 
        plan_type: 'pro', 
        max_exchange_accounts: 10, 
        is_unlimited: false,
        is_default: true
      },
      'lifetime': { 
        plan_type: 'lifetime', 
        max_exchange_accounts: 0, 
        is_unlimited: true,
        is_default: true
      }
    };

    return defaultLimits[planType] || { 
      plan_type: planType, 
      max_exchange_accounts: 1, 
      is_unlimited: false,
      is_default: true
    };
  }
}

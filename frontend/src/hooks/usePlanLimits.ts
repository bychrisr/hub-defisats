import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { PlanLimitsService, PlanLimits } from '@/services/planLimits.service';

export function usePlanLimits() {
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadPlanLimits = useCallback(async () => {
    if (!user?.plan_type) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 PLAN LIMITS HOOK - Loading limits for plan:', user.plan_type);
      
      const limits = await PlanLimitsService.getPlanLimits(user.plan_type);
      setPlanLimits(limits);

      console.log('✅ PLAN LIMITS HOOK - Limits loaded:', {
        planType: limits.plan_type,
        maxExchangeAccounts: limits.max_exchange_accounts,
        isUnlimited: limits.is_unlimited
      });

    } catch (error: any) {
      console.error('❌ PLAN LIMITS HOOK - Error loading plan limits:', error);
      
      // Fallback para limites padrão
      const defaultLimits = PlanLimitsService.getDefaultLimits(user.plan_type);
      setPlanLimits(defaultLimits);
      setError(error.message || 'Failed to load plan limits');
    } finally {
      setIsLoading(false);
    }
  }, [user?.plan_type]);

  useEffect(() => {
    loadPlanLimits();
  }, [loadPlanLimits]);

  const getAccountLimit = useCallback((): number | 'unlimited' => {
    if (!planLimits) return 1;
    
    if (planLimits.is_unlimited) {
      return 'unlimited';
    }
    
    return planLimits.max_exchange_accounts;
  }, [planLimits]);

  const canCreateAccount = useCallback((currentAccountCount: number): boolean => {
    if (!planLimits) return false;
    
    if (planLimits.is_unlimited) {
      return true;
    }
    
    return currentAccountCount < planLimits.max_exchange_accounts;
  }, [planLimits]);

  const getAccountStats = useCallback((currentAccountCount: number) => {
    if (!planLimits) {
      return {
        current: currentAccountCount,
        limit: 1,
        canCreate: currentAccountCount < 1,
        isUnlimited: false
      };
    }

    return {
      current: currentAccountCount,
      limit: planLimits.is_unlimited ? 'unlimited' : planLimits.max_exchange_accounts,
      canCreate: canCreateAccount(currentAccountCount),
      isUnlimited: planLimits.is_unlimited
    };
  }, [planLimits, canCreateAccount]);

  return {
    planLimits,
    isLoading,
    error,
    loadPlanLimits,
    getAccountLimit,
    canCreateAccount,
    getAccountStats
  };
}

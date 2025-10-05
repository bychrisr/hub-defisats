import { api } from '@/lib/api';

export interface PlanLimits {
  id: string;
  planId: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
  createdAt: string;
  updatedAt: string;
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

export interface UsageStatistics {
  totalPlans: number;
  plansWithLimits: number;
  averageLimits: {
    exchangeAccounts: number;
    automations: number;
    indicators: number;
    simulations: number;
    backtests: number;
  };
}

export class PlanLimitsService {
  /**
   * Criar limites para um plano
   */
  async createPlanLimits(data: CreatePlanLimitsRequest): Promise<PlanLimits> {
    try {
      const response = await api.post('/api/plan-limits', data);
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Created plan limits:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create plan limits');
      }
    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error creating plan limits:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create plan limits');
    }
  }

  /**
   * Atualizar limites de um plano
   */
  async updatePlanLimits(data: UpdatePlanLimitsRequest): Promise<PlanLimits> {
    try {
      const response = await api.put(`/api/plan-limits/${data.id}`, data);
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Updated plan limits:', response.data.data);
        console.log('🔍 PlanLimitsService - Full response:', response.data);
        console.log('🔍 PlanLimitsService - Response data type:', typeof response.data.data);
        console.log('🔍 PlanLimitsService - Response data keys:', Object.keys(response.data.data || {}));
        console.log('🔍 PlanLimitsService - Response data stringified:', JSON.stringify(response.data.data, null, 2));
        console.log('🔍 PlanLimitsService - Response data parsed:', JSON.parse(JSON.stringify(response.data.data)));
        console.log('🔍 PlanLimitsService - Response data plan:', response.data.data?.plan);
        console.log('🔍 PlanLimitsService - Response data plan name:', response.data.data?.plan?.name);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update plan limits');
      }
    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error updating plan limits:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update plan limits');
    }
  }

  /**
   * Obter limites de um plano
   */
  async getPlanLimits(planId: string): Promise<PlanLimits | null> {
    try {
      const response = await api.get(`/api/plan-limits/plan/${planId}`);
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Retrieved plan limits:', response.data.data);
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ PlanLimitsService - No plan limits found for plan:', planId);
        return null;
      }
      console.error('❌ PlanLimitsService - Error getting plan limits:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get plan limits');
    }
  }

  /**
   * Listar todos os limites de planos
   */
  async getAllPlanLimits(): Promise<PlanLimits[]> {
    try {
      const response = await api.get('/api/plan-limits');
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Retrieved all plan limits:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get all plan limits');
      }
    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error getting all plan limits:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get all plan limits');
    }
  }

  /**
   * Obter limites de um usuário
   */
  async getUserLimits(userId: string): Promise<PlanLimits | null> {
    try {
      const response = await api.get(`/api/plan-limits/user/${userId}`);
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Retrieved user limits:', response.data.data);
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️ PlanLimitsService - No plan limits found for user:', userId);
        return null;
      }
      console.error('❌ PlanLimitsService - Error getting user limits:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get user limits');
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
      const response = await api.get(`/api/plan-limits/validate/${userId}?limitType=${limitType}`);
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Validated limit:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to validate limit');
      }
    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error validating limit:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to validate limit');
    }
  }

  /**
   * Deletar limites de um plano
   */
  async deletePlanLimits(id: string): Promise<void> {
    try {
      const response = await api.delete(`/api/plan-limits/${id}`);
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Deleted plan limits:', id);
      } else {
        throw new Error(response.data.message || 'Failed to delete plan limits');
      }
    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error deleting plan limits:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete plan limits');
    }
  }

  /**
   * Obter estatísticas de uso
   */
  async getUsageStatistics(): Promise<UsageStatistics> {
    try {
      const response = await api.get('/api/plan-limits/stats');
      
      if (response.data.success) {
        console.log('✅ PlanLimitsService - Retrieved usage statistics:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get usage statistics');
      }
    } catch (error: any) {
      console.error('❌ PlanLimitsService - Error getting usage statistics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get usage statistics');
    }
  }

  /**
   * Verificar se um limite pode ser criado
   */
  async canCreate(
    userId: string,
    limitType: 'EXCHANGE_ACCOUNTS' | 'AUTOMATIONS' | 'INDICATORS' | 'SIMULATIONS' | 'BACKTESTS'
  ): Promise<boolean> {
    try {
      const validation = await this.validateLimit(userId, limitType);
      return validation.isValid;
    } catch (error) {
      console.error('❌ PlanLimitsService - Error checking if can create:', error);
      return false;
    }
  }

  /**
   * Obter informações de limite para exibição
   */
  async getLimitInfo(
    userId: string,
    limitType: 'EXCHANGE_ACCOUNTS' | 'AUTOMATIONS' | 'INDICATORS' | 'SIMULATIONS' | 'BACKTESTS'
  ): Promise<{
    current: number;
    max: number;
    remaining: number;
    percentage: number;
    canCreate: boolean;
  }> {
    try {
      const validation = await this.validateLimit(userId, limitType);
      
      return {
        current: validation.currentCount,
        max: validation.maxLimit,
        remaining: Math.max(0, validation.maxLimit - validation.currentCount),
        percentage: validation.maxLimit > 0 ? (validation.currentCount / validation.maxLimit) * 100 : 0,
        canCreate: validation.isValid
      };
    } catch (error) {
      console.error('❌ PlanLimitsService - Error getting limit info:', error);
      return {
        current: 0,
        max: 0,
        remaining: 0,
        percentage: 0,
        canCreate: false
      };
    }
  }
}

export const planLimitsService = new PlanLimitsService();

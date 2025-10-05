import { api } from '@/lib/api';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_sats: number;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  max_positions: number;
  max_automations: number;
  max_notifications: number;
  api_calls_per_day: number;
  is_active: boolean;
  is_popular: boolean;
  has_api_access: boolean;
  has_advanced: boolean;
  has_priority: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanWithUsers extends Plan {
  users: number;
}

export class PlansService {
  /**
   * Listar todos os planos
   */
  async getAllPlans(): Promise<Plan[]> {
    try {
      const response = await api.get('/api/plans-public');
      
      if (response.data.success) {
        console.log('✅ PlansService - Retrieved all plans:', response.data.data?.length || 0);
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Failed to get all plans');
      }
    } catch (error: any) {
      console.error('❌ PlansService - Error getting all plans:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get all plans');
    }
  }

  /**
   * Obter estatísticas de usuários por plano
   */
  async getPlanUserStats(): Promise<Record<string, number>> {
    try {
      const response = await api.get('/api/plans/user-stats');
      
      if (response.data.success) {
        console.log('✅ PlansService - Retrieved plan user stats:', response.data.data);
        return response.data.data || {};
      } else {
        throw new Error(response.data.message || 'Failed to get plan user stats');
      }
    } catch (error: any) {
      console.error('❌ PlansService - Error getting plan user stats:', error);
      // Retornar objeto vazio em caso de erro
      return {};
    }
  }

  /**
   * Obter planos com contagem de usuários
   */
  async getPlansWithUsers(): Promise<PlanWithUsers[]> {
    try {
      const [plans, userStats] = await Promise.all([
        this.getAllPlans(),
        this.getPlanUserStats()
      ]);

      const plansWithUsers: PlanWithUsers[] = plans.map(plan => ({
        ...plan,
        users: userStats[plan.id] || 0
      }));

      console.log('✅ PlansService - Retrieved plans with users:', plansWithUsers.length);
      return plansWithUsers;
    } catch (error: any) {
      console.error('❌ PlansService - Error getting plans with users:', error);
      throw new Error(error.message || 'Failed to get plans with users');
    }
  }

  /**
   * Criar novo plano
   */
  async createPlan(planData: any): Promise<Plan> {
    try {
      const response = await api.post('/api/plans-public', planData);
      
      if (response.data.success) {
        console.log('✅ PlansService - Created plan:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create plan');
      }
    } catch (error: any) {
      console.error('❌ PlansService - Error creating plan:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create plan');
    }
  }

  /**
   * Atualizar plano
   */
  async updatePlan(planId: string, planData: any): Promise<Plan> {
    try {
      const response = await api.put(`/api/plans-public/${planId}`, planData);
      
      if (response.data.success) {
        console.log('✅ PlansService - Updated plan:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update plan');
      }
    } catch (error: any) {
      console.error('❌ PlansService - Error updating plan:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update plan');
    }
  }

  /**
   * Deletar plano
   */
  async deletePlan(planId: string): Promise<void> {
    try {
      const response = await api.delete(`/api/plans-public/${planId}`);
      
      if (response.data.success) {
        console.log('✅ PlansService - Deleted plan:', planId);
      } else {
        throw new Error(response.data.message || 'Failed to delete plan');
      }
    } catch (error: any) {
      console.error('❌ PlansService - Error deleting plan:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete plan');
    }
  }

  /**
   * Obter plano por ID
   */
  async getPlanById(planId: string): Promise<Plan> {
    try {
      const response = await api.get(`/api/plans-public/${planId}`);
      
      if (response.data.success) {
        console.log('✅ PlansService - Retrieved plan by ID:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get plan by ID');
      }
    } catch (error: any) {
      console.error('❌ PlansService - Error getting plan by ID:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get plan by ID');
    }
  }
}

export const plansService = new PlansService();

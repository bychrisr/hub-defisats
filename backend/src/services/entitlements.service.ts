import { PrismaClient } from '@prisma/client';

export class EntitlementsService {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Garante que o usuário tenha entitlement FREE
   */
  async ensureFreeEntitlement(userId: string) {
    return await this.prisma.userEntitlements.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        plan: 'FREE',
        feature_set: 'free',
        demo_mode: true
      },
      update: {}
    });
  }
  
  /**
   * Obtém entitlements do usuário
   */
  async getUserEntitlements(userId: string) {
    return await this.prisma.userEntitlements.findUnique({
      where: { user_id: userId }
    });
  }
  
  /**
   * Atualiza plano do usuário
   */
  async updatePlan(userId: string, plan: string, demoMode: boolean = false) {
    return await this.prisma.userEntitlements.update({
      where: { user_id: userId },
      data: {
        plan,
        feature_set: plan.toLowerCase(),
        demo_mode: demoMode,
        updated_at: new Date()
      }
    });
  }

  /**
   * Verifica se usuário tem uma feature específica
   */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    if (!entitlements) return false;

    const features = this.getFeaturesByPlan(entitlements.feature_set);
    return features.includes(feature);
  }

  /**
   * Obtém features disponíveis por plano
   */
  private getFeaturesByPlan(plan: string): string[] {
    const featureMap: Record<string, string[]> = {
      free: [
        'view_dashboard',
        'create_draft_bots',
        'backtest',
        'view_reports_readonly'
      ],
      basic: [
        'view_dashboard',
        'create_draft_bots',
        'backtest',
        'view_reports_readonly',
        'connect_1_exchange',
        'run_live_bots_limited',
        'basic_support'
      ],
      advanced: [
        'view_dashboard',
        'create_draft_bots',
        'backtest',
        'view_reports_readonly',
        'connect_1_exchange',
        'run_live_bots_limited',
        'basic_support',
        'unlimited_bots',
        'advanced_reports',
        'priority_ws'
      ],
      pro: [
        'view_dashboard',
        'create_draft_bots',
        'backtest',
        'view_reports_readonly',
        'connect_1_exchange',
        'run_live_bots_limited',
        'basic_support',
        'unlimited_bots',
        'advanced_reports',
        'priority_ws',
        'multi_tenant',
        'compliance',
        'api_access',
        'white_label'
      ]
    };

    return featureMap[plan] || featureMap.free;
  }
}

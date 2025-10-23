import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';

export class PlansService {
  private prisma: PrismaClient;
  private fastify: FastifyInstance;

  constructor(prisma: PrismaClient, fastify: FastifyInstance) {
    this.prisma = prisma;
    this.fastify = fastify;
  }

  async choosePlan(userId: string, plan: string): Promise<{ success: boolean; entitlements?: any }> {
    try {
      // Validate plan
      const validPlans = ['FREE', 'BASIC', 'ADVANCED', 'PRO'];
      if (!validPlans.includes(plan)) {
        return { success: false };
      }

      // Update user entitlements
      const entitlements = await this.prisma.userEntitlements.update({
        where: { user_id: userId },
        data: {
          plan,
          feature_set: plan.toLowerCase(),
          demo_mode: plan === 'FREE',
          updated_at: new Date()
        }
      });

      this.fastify.log.info(`User ${userId} upgraded to ${plan} plan`);

      return { success: true, entitlements };
    } catch (error) {
      this.fastify.log.error('Error choosing plan:', error);
      return { success: false };
    }
  }

  async getAvailablePlans() {
    return [
      {
        id: 'FREE',
        name: 'Free',
        price: 0,
        features: ['demo_mode', 'create_draft_bots', 'backtest', 'view_reports_readonly']
      },
      {
        id: 'BASIC',
        name: 'Basic',
        price: 29,
        features: ['connect_1_exchange', 'run_live_bots_limited', 'basic_support']
      },
      {
        id: 'ADVANCED',
        name: 'Advanced',
        price: 99,
        features: ['unlimited_bots', 'advanced_reports', 'priority_ws']
      },
      {
        id: 'PRO',
        name: 'Pro',
        price: 299,
        features: ['multi_tenant', 'compliance', 'api_access', 'white_label']
      }
    ];
  }
}

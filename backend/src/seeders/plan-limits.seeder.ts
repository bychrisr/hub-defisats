/**
 * Plan Limits Seeder
 * 
 * Cria limites padrão para todos os planos
 * Define limites de recursos por plano
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface PlanLimitsData {
  planSlug: string;
  maxExchangeAccounts: number;
  maxAutomations: number;
  maxIndicators: number;
  maxSimulations: number;
  maxBacktests: number;
}

const defaultPlanLimits: PlanLimitsData[] = [
  {
    planSlug: 'free',
    maxExchangeAccounts: 1,
    maxAutomations: 1,
    maxIndicators: 5,
    maxSimulations: 1,
    maxBacktests: 2
  },
  {
    planSlug: 'basic',
    maxExchangeAccounts: 2,
    maxAutomations: 3,
    maxIndicators: 10,
    maxSimulations: 3,
    maxBacktests: 5
  },
  {
    planSlug: 'advanced',
    maxExchangeAccounts: 5,
    maxAutomations: 8,
    maxIndicators: 25,
    maxSimulations: 8,
    maxBacktests: 15
  },
  {
    planSlug: 'pro',
    maxExchangeAccounts: 10,
    maxAutomations: 15,
    maxIndicators: 50,
    maxSimulations: 15,
    maxBacktests: 30
  },
  {
    planSlug: 'lifetime',
    maxExchangeAccounts: -1, // Ilimitado
    maxAutomations: -1, // Ilimitado
    maxIndicators: -1, // Ilimitado
    maxSimulations: -1, // Ilimitado
    maxBacktests: -1 // Ilimitado
  }
];

export const planLimitsSeeder: Seeder = {
  name: 'plan-limits',
  description: 'Creates default plan limits for all plans',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      const createdLimits: string[] = [];
      const errors: string[] = [];

      console.log('📦 Running seeder: plan-limits');

      // Verificar se já existem plan limits
      const existingLimits = await prisma.planLimits.count();
      if (existingLimits > 0) {
        console.log(`⚠️  Plan limits already exist (${existingLimits} records). Skipping seeding.`);
        return {
          success: true,
          message: `Plan limits already exist (${existingLimits} records). Skipping seeding.`,
          created: 0,
          errors: []
        };
      }

      // Buscar todos os planos
      const plans = await prisma.plan.findMany({
        select: { id: true, slug: true, name: true }
      });

      if (plans.length === 0) {
        throw new Error('No plans found. Please run plans seeder first.');
      }

      // Criar limites para cada plano
      for (const planLimitData of defaultPlanLimits) {
        try {
          // Encontrar o plano correspondente
          const plan = plans.find(p => p.slug === planLimitData.planSlug);
          if (!plan) {
            console.log(`⚠️  Plan with slug '${planLimitData.planSlug}' not found, skipping...`);
            continue;
          }

          const planLimit = await prisma.planLimits.create({
            data: {
              plan_id: plan.id,
              max_exchange_accounts: planLimitData.maxExchangeAccounts,
              max_automations: planLimitData.maxAutomations,
              max_indicators: planLimitData.maxIndicators,
              max_simulations: planLimitData.maxSimulations,
              max_backtests: planLimitData.maxBacktests,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          createdLimits.push(`${plan.name} (${planLimitData.planSlug})`);
          console.log(`✅ Created limits for plan: ${plan.name}`);
        } catch (error: any) {
          const errorMsg = `Failed to create limits for plan ${planLimitData.planSlug}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ plan-limits: Created ${createdLimits.length} plan limits`);
      return {
        success: true,
        message: `Created ${createdLimits.length} plan limits`,
        created: createdLimits.length,
        errors
      };

    } catch (error: any) {
      console.error('❌ plan-limits: Failed to seed plan limits:', error);
      return {
        success: false,
        message: `Failed to seed plan limits: ${error.message}`,
        created: 0,
        errors: [error.message]
      };
    }
  }
};

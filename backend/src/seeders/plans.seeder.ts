/**
 * Plans Seeder
 * 
 * Cria planos padrão do sistema
 * Inclui planos gratuitos e pagos
 */

import { getPrisma } from '../lib/prisma';
import { Seeder, SeederResult } from './index';

interface PlanData {
  name: string;
  slug: string;
  description: string;
  price_sats: number;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  is_active: boolean;
  has_api_access: boolean;
  has_advanced: boolean;
  has_priority: boolean;
  max_notifications: number;
  order: number;
}

const defaultPlans: PlanData[] = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Plano gratuito com recursos básicos',
    price_sats: 0,
    features: [
      'Até 3 posições simultâneas',
      '1 automação básica',
      'Notificações por email',
      'Suporte por email',
      'Dashboard básico'
    ],
    is_active: true,
    has_api_access: false,
    has_advanced: false,
    has_priority: false,
    max_notifications: 10,
    order: 1
  },
  {
    name: 'Basic',
    slug: 'basic',
    description: 'Plano básico para traders iniciantes',
    price_sats: 100000,
    price_yearly: 100000,
    features: [
      'Até 5 posições simultâneas',
      '3 automações básicas',
      'Notificações em tempo real',
      'Suporte prioritário',
      'Dashboard melhorado',
      'Relatórios básicos'
    ],
    is_active: true,
    has_api_access: true,
    has_advanced: false,
    has_priority: true,
    max_notifications: 25,
    order: 2
  },
  {
    name: 'Advanced',
    slug: 'advanced',
    description: 'Plano avançado com recursos premium',
    price_sats: 250000,
    price_yearly: 250000,
    features: [
      'Até 10 posições simultâneas',
      '5 automações avançadas',
      'Notificações personalizadas',
      'Suporte prioritário',
      'Dashboard avançado',
      'Relatórios detalhados',
      'API completa'
    ],
    is_active: true,
    has_api_access: true,
    has_advanced: true,
    has_priority: true,
    max_notifications: 50,
    order: 3
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Plano profissional com todos os recursos',
    price_sats: 500000,
    price_yearly: 500000,
    features: [
      'Até 20 posições simultâneas',
      '10 automações avançadas',
      'Notificações personalizadas',
      'Suporte dedicado',
      'Dashboard customizável',
      'Relatórios avançados',
      'API ilimitada',
      'Integração personalizada'
    ],
    is_active: true,
    has_api_access: true,
    has_advanced: true,
    has_priority: true,
    max_notifications: 100,
    order: 4
  },
  {
    name: 'Lifetime',
    slug: 'lifetime',
    description: 'Acesso vitalício a todos os recursos',
    price_sats: 1000000,
    features: [
      'Posições ilimitadas',
      'Automações ilimitadas',
      'Notificações personalizadas',
      'Suporte dedicado',
      'Dashboard customizável',
      'Relatórios avançados',
      'API ilimitada',
      'Integração personalizada',
      'SLA garantido',
      'Acesso vitalício'
    ],
    is_active: true,
    has_api_access: true,
    has_advanced: true,
    has_priority: true,
    max_notifications: -1,
    order: 5
  }
];

export const plansSeeder: Seeder = {
  name: 'plans',
  description: 'Creates default subscription plans',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      const createdPlans: string[] = [];
      const errors: string[] = [];

      console.log('📦 Running seeder: plans');

      // Verificar se já existem planos
      const existingPlans = await prisma.plan.count();
      if (existingPlans > 0) {
        console.log(`⚠️  Plans already exist (${existingPlans} records). Skipping seeding.`);
        return {
          success: true,
          message: `Plans already exist (${existingPlans} records). Skipping seeding.`,
          count: 0,
          errors: []
        };
      }

      // Inserir planos padrão
      for (const planData of defaultPlans) {
        try {
          const plan = await prisma.plan.create({
            data: {
              name: planData.name,
              slug: planData.slug,
              description: planData.description,
              price_sats: planData.price_sats,
              price_monthly: planData.price_monthly,
              price_yearly: planData.price_yearly,
              features: planData.features,
              is_active: planData.is_active,
              has_api_access: planData.has_api_access,
              has_advanced: planData.has_advanced,
              has_priority: planData.has_priority,
              max_notifications: planData.max_notifications,
              sort_order: planData.order,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          createdPlans.push(plan.name);
          console.log(`✅ Created plan: ${plan.name}`);
        } catch (error: any) {
          const errorMsg = `Failed to create plan ${planData.name}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ plans: Created ${createdPlans.length} plans`);
      return {
        success: true,
        message: `Created ${createdPlans.length} plans`,
        count: createdPlans.length,
        errors
      };

    } catch (error: any) {
      console.error('❌ plans: Failed to seed plans:', error);
      return {
        success: false,
        message: `Failed to seed plans: ${error.message}`,
        count: 0,
        errors: [error.message]
      };
    }
  }
};
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
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    maxPositions: number;
    maxAutomations: number;
    maxNotifications: number;
    apiCallsPerDay: number;
  };
  isActive: boolean;
  isPopular: boolean;
}

const defaultPlans: PlanData[] = [
  {
    name: 'Free',
    description: 'Plano gratuito para começar',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      'Até 3 posições simultâneas',
      '1 automação básica',
      'Notificações por email',
      'Suporte por email',
      'Dashboard básico'
    ],
    limits: {
      maxPositions: 3,
      maxAutomations: 1,
      maxNotifications: 10,
      apiCallsPerDay: 100
    },
    isActive: true,
    isPopular: false
  },
  {
    name: 'Pro',
    description: 'Para traders ativos',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Até 10 posições simultâneas',
      '5 automações avançadas',
      'Notificações em tempo real',
      'Suporte prioritário',
      'Dashboard avançado',
      'Relatórios detalhados',
      'API completa'
    ],
    limits: {
      maxPositions: 10,
      maxAutomations: 5,
      maxNotifications: 100,
      apiCallsPerDay: 1000
    },
    isActive: true,
    isPopular: true
  },
  {
    name: 'Enterprise',
    description: 'Para traders profissionais',
    price: 99.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Posições ilimitadas',
      'Automações ilimitadas',
      'Notificações personalizadas',
      'Suporte dedicado',
      'Dashboard customizável',
      'Relatórios avançados',
      'API ilimitada',
      'Integração personalizada',
      'SLA garantido'
    ],
    limits: {
      maxPositions: -1, // ilimitado
      maxAutomations: -1, // ilimitado
      maxNotifications: -1, // ilimitado
      apiCallsPerDay: -1 // ilimitado
    },
    isActive: true,
    isPopular: false
  },
  {
    name: 'Pro Annual',
    description: 'Plano Pro com desconto anual',
    price: 299.99,
    currency: 'USD',
    interval: 'year',
    features: [
      'Até 10 posições simultâneas',
      '5 automações avançadas',
      'Notificações em tempo real',
      'Suporte prioritário',
      'Dashboard avançado',
      'Relatórios detalhados',
      'API completa',
      'Desconto de 2 meses'
    ],
    limits: {
      maxPositions: 10,
      maxAutomations: 5,
      maxNotifications: 100,
      apiCallsPerDay: 1000
    },
    isActive: true,
    isPopular: false
  }
];

export const plansSeeder: Seeder = {
  name: 'plans',
  description: 'Creates default subscription plans',

  async run(): Promise<SeederResult> {
    try {
      const prisma = await getPrisma();
      
      // Verificar se já existem planos
      const existingCount = await prisma.plan.count();
      
      if (existingCount > 0) {
        return {
          success: true,
          message: `Plans already exist (${existingCount} records). Skipping seeding.`,
          count: existingCount
        };
      }

      // Inserir planos padrão
      const createdPlans = await prisma.plan.createMany({
        data: defaultPlans.map(plan => ({
          name: plan.name,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
          max_positions: plan.limits.maxPositions,
          max_automations: plan.limits.maxAutomations,
          max_notifications: plan.limits.maxNotifications,
          api_calls_per_day: plan.limits.apiCallsPerDay,
          is_active: plan.isActive,
          is_popular: plan.isPopular,
          created_at: new Date(),
          updated_at: new Date()
        })),
        skipDuplicates: true
      });

      // Verificar quantos foram realmente criados
      const finalCount = await prisma.plan.count();

      return {
        success: true,
        message: `Successfully created ${finalCount} subscription plans`,
        count: finalCount
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed plans: ${error.message}`,
        errors: [error.message]
      };
    }
  }
};

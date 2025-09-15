import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultPlans = [
  {
    name: 'Free',
    slug: 'free' as const,
    description: 'Plano gratuito com funcionalidades básicas para começar',
    price_monthly: null,
    price_yearly: null,
    price_lifetime: null,
    max_automations: 1,
    max_backtests: 5,
    max_notifications: 10,
    has_priority: false,
    has_advanced: false,
    has_api_access: false,
    order: 1,
    features: {
      automations: ['Margin Guard Básico'],
      notifications: ['Email'],
      backtests: ['Dados Históricos Limitados'],
      advanced: [],
      support: ['Suporte por Email'],
    },
  },
  {
    name: 'Basic',
    slug: 'basic' as const,
    description: 'Plano básico com automações essenciais',
    price_monthly: 29.90,
    price_yearly: 299.00,
    price_lifetime: null,
    max_automations: 5,
    max_backtests: 50,
    max_notifications: 100,
    has_priority: false,
    has_advanced: false,
    has_api_access: false,
    order: 2,
    features: {
      automations: ['Margin Guard', 'Take Profit', 'Stop Loss'],
      notifications: ['Email', 'Telegram'],
      backtests: ['Dados Históricos Completos', 'Relatórios Básicos'],
      advanced: [],
      support: ['Suporte Prioritário por Email'],
    },
  },
  {
    name: 'Advanced',
    slug: 'advanced' as const,
    description: 'Plano avançado com funcionalidades premium',
    price_monthly: 79.90,
    price_yearly: 799.00,
    price_lifetime: 1499.00,
    max_automations: 20,
    max_backtests: 200,
    max_notifications: 500,
    has_priority: true,
    has_advanced: true,
    has_api_access: false,
    order: 3,
    features: {
      automations: ['Margin Guard', 'Take Profit', 'Stop Loss', 'Auto Entry', 'Trailing Stop'],
      notifications: ['Email', 'Telegram', 'WhatsApp'],
      backtests: ['Dados Históricos Completos', 'Relatórios Avançados', 'Análise de Performance'],
      advanced: ['Simulações em Tempo Real', 'API Webhooks', 'Relatórios Customizados'],
      support: ['Suporte Prioritário 24/7', 'Consultoria Técnica'],
    },
  },
  {
    name: 'Pro',
    slug: 'pro' as const,
    description: 'Plano profissional com recursos completos',
    price_monthly: 149.90,
    price_yearly: 1499.00,
    price_lifetime: 2499.00,
    max_automations: -1, // Unlimited
    max_backtests: -1, // Unlimited
    max_notifications: -1, // Unlimited
    has_priority: true,
    has_advanced: true,
    has_api_access: true,
    order: 4,
    features: {
      automations: ['Todas as Automações Disponíveis', 'Configurações Avançadas', 'Regras Customizadas'],
      notifications: ['Todas as Plataformas', 'Templates Customizados', 'Relatórios de Notificações'],
      backtests: ['Dados Históricos Ilimitados', 'Relatórios Profissionais', 'Análise de Risco Avançada', 'Comparação de Estratégias'],
      advanced: ['API Completa', 'Webhooks Avançados', 'Integrações Externas', 'Dashboard Personalizado'],
      support: ['Suporte Dedicado 24/7', 'Consultoria Estratégica', 'Treinamentos'],
    },
  },
  {
    name: 'Lifetime',
    slug: 'lifetime' as const,
    description: 'Acesso vitalício com todos os recursos',
    price_monthly: null,
    price_yearly: null,
    price_lifetime: 4999.00,
    max_automations: -1, // Unlimited
    max_backtests: -1, // Unlimited
    max_notifications: -1, // Unlimited
    has_priority: true,
    has_advanced: true,
    has_api_access: true,
    order: 5,
    features: {
      automations: ['Todas as Funcionalidades', 'Atualizações Vitalícias', 'Suporte Técnico Completo'],
      notifications: ['Integração Completa', 'Personalização Total', 'Analytics de Notificações'],
      backtests: ['Histórico Completo', 'Ferramentas de Análise Profissional', 'Relatórios Executivos'],
      advanced: ['Acesso Total à API', 'Integrações Avançadas', 'Customizações Especiais'],
      support: ['Suporte VIP 24/7', 'Consultoria Personalizada', 'Acesso antecipado a novos recursos'],
    },
  },
];

async function seedPlans() {
  console.log('🌱 Starting plans seeding...');

  try {
    // Clear existing plans
    await prisma.plan.deleteMany({});
    console.log('🗑️ Cleared existing plans');

    // Create default plans
    for (const planData of defaultPlans) {
      const plan = await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Created plan: ${plan.name} (${plan.slug})`);
    }

    console.log('🎉 Plans seeding completed successfully!');
    console.log(`📊 Created ${defaultPlans.length} default plans`);

    // Show summary
    const plans = await prisma.plan.findMany({
      select: {
        name: true,
        slug: true,
        price_monthly: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    console.log('\n📋 Plans Summary:');
    plans.forEach(plan => {
      const price = plan.price_monthly ? `R$ ${plan.price_monthly}/mês` : 'Grátis';
      console.log(`  • ${plan.name} (${plan.slug}): ${price} - ${plan._count.users} usuários`);
    });

  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedPlans()
  .then(() => {
    console.log('✅ Plans seeding finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Plans seeding failed:', error);
    process.exit(1);
  });

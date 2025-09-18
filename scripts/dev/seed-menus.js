#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMenus() {
  console.log('🌱 Iniciando seed dos menus...');

  try {
    // Criar tipos de menu
    console.log('📋 Criando tipos de menu...');
    
    const mainMenuType = await prisma.menuType.upsert({
      where: { name: 'main' },
      update: {},
      create: {
        name: 'main',
        displayName: 'Menu Principal',
        description: 'Menu principal de navegação (mobile e desktop)',
        isActive: true
      }
    });

    const secondaryMenuType = await prisma.menuType.upsert({
      where: { name: 'secondary' },
      update: {},
      create: {
        name: 'secondary',
        displayName: 'Menu Secundário',
        description: 'Menu secundário do drawer mobile',
        isActive: true
      }
    });

    const userMenuType = await prisma.menuType.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        displayName: 'Menu do Usuário',
        description: 'Menu específico do usuário (drawer mobile)',
        isActive: true
      }
    });

    console.log('✅ Tipos de menu criados!');

    // Criar itens do menu principal
    console.log('🏠 Criando itens do menu principal...');
    
    const mainMenuItems = [
      {
        name: 'Dashboard',
        mobileName: 'Home',
        href: '/dashboard',
        icon: 'Home',
        order: 1,
        menuTypeId: mainMenuType.id,
        description: 'Página inicial do sistema'
      },
      {
        name: 'Automations',
        mobileName: 'Automations',
        href: '/automation',
        icon: 'Settings',
        order: 2,
        menuTypeId: mainMenuType.id,
        description: 'Gerenciar automações de trading'
      },
      {
        name: 'Positions',
        mobileName: 'Positions',
        href: '/positions',
        icon: 'BarChart3',
        order: 3,
        menuTypeId: mainMenuType.id,
        description: 'Visualizar posições ativas'
      },
      {
        name: 'Backtests',
        mobileName: 'Backtests',
        href: '/backtests',
        icon: 'Activity',
        order: 4,
        menuTypeId: mainMenuType.id,
        description: 'Executar e analisar backtests'
      },
      {
        name: 'Reports',
        mobileName: 'Reports',
        href: '/reports',
        icon: 'Shield',
        order: 5,
        menuTypeId: mainMenuType.id,
        description: 'Relatórios e análises'
      }
    ];

    for (const item of mainMenuItems) {
      await prisma.menuItem.upsert({
        where: { 
          id: `${item.href}-${item.menuTypeId}` // Usar uma chave única simples
        },
        update: item,
        create: {
          ...item,
          id: `${item.href}-${item.menuTypeId}`
        }
      });
    }

    console.log('✅ Itens do menu principal criados!');

    // Criar itens do menu secundário
    console.log('🔧 Criando itens do menu secundário...');
    
    const secondaryMenuItems = [
      {
        name: 'Criptomoedas',
        href: '/cryptocurrencies',
        icon: 'Coins',
        order: 1,
        menuTypeId: secondaryMenuType.id,
        description: 'Informações sobre criptomoedas'
      },
      {
        name: 'Câmbios',
        href: '/exchanges',
        icon: 'TrendingUp',
        order: 2,
        menuTypeId: secondaryMenuType.id,
        description: 'Lista de exchanges suportadas'
      },
      {
        name: 'NFT',
        href: '/nft',
        icon: 'Image',
        order: 3,
        menuTypeId: secondaryMenuType.id,
        description: 'Mercado de NFTs'
      },
      {
        name: 'Informação',
        href: '/information',
        icon: 'Info',
        order: 4,
        menuTypeId: secondaryMenuType.id,
        description: 'Informações gerais'
      },
      {
        name: 'Produtos',
        href: '/products',
        icon: 'Package',
        order: 5,
        menuTypeId: secondaryMenuType.id,
        description: 'Nossos produtos'
      },
      {
        name: 'API',
        href: '/api',
        icon: 'Code',
        order: 6,
        menuTypeId: secondaryMenuType.id,
        description: 'Documentação da API'
      }
    ];

    for (const item of secondaryMenuItems) {
      await prisma.menuItem.upsert({
        where: { 
          id: `${item.href}-${item.menuTypeId}`
        },
        update: item,
        create: {
          ...item,
          id: `${item.href}-${item.menuTypeId}`
        }
      });
    }

    console.log('✅ Itens do menu secundário criados!');

    // Criar itens do menu do usuário
    console.log('👤 Criando itens do menu do usuário...');
    
    const userMenuItems = [
      {
        name: 'Os meus Candies',
        href: '/candies',
        icon: 'Candy',
        order: 1,
        menuTypeId: userMenuType.id,
        description: 'Gerenciar candies',
        badge: 'NEW',
        badgeColor: 'purple'
      },
      {
        name: 'A minha carteira',
        href: '/wallet',
        icon: 'Star',
        order: 2,
        menuTypeId: userMenuType.id,
        description: 'Minha carteira digital',
        badge: 'HOT',
        badgeColor: 'yellow'
      },
      {
        name: 'A minha conta',
        href: '/account',
        icon: 'User',
        order: 3,
        menuTypeId: userMenuType.id,
        description: 'Configurações da conta'
      }
    ];

    for (const item of userMenuItems) {
      await prisma.menuItem.upsert({
        where: { 
          id: `${item.href}-${item.menuTypeId}`
        },
        update: item,
        create: {
          ...item,
          id: `${item.href}-${item.menuTypeId}`
        }
      });
    }

    console.log('✅ Itens do menu do usuário criados!');

    // Criar configurações do sistema
    console.log('⚙️ Criando configurações do sistema...');
    
    const systemConfigs = [
      {
        key: 'app_name',
        value: 'defiSATS',
        type: 'string',
        description: 'Nome da aplicação'
      },
      {
        key: 'app_version',
        value: '1.0.0',
        type: 'string',
        description: 'Versão da aplicação'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        type: 'boolean',
        description: 'Modo de manutenção'
      },
      {
        key: 'max_menu_items',
        value: '10',
        type: 'number',
        description: 'Número máximo de itens por menu'
      }
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config
      });
    }

    console.log('✅ Configurações do sistema criadas!');

    console.log('🎉 Seed dos menus concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedMenus()
    .then(() => {
      console.log('✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { seedMenus };

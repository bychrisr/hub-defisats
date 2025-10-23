import { PrismaClient } from '@prisma/client';

export async function seedExchanges(prisma: PrismaClient) {
  console.log('🌱 Seeding exchanges...');

  // Create LN Markets exchange
  const lnMarkets = await prisma.exchange.upsert({
    where: { slug: 'lnmarkets' },
    update: {},
    create: {
      name: 'LN Markets',
      slug: 'lnmarkets',
      description: 'Lightning Network futures trading platform',
      website: 'https://lnmarkets.com',
      logo_url: 'https://lnmarkets.com/logo.png',
      is_active: true,
      api_version: 'v2',
    },
  });

  // Create credential types for LN Markets
  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: lnMarkets.id,
        field_name: 'api_key',
      },
    },
    update: {},
    create: {
      exchange_id: lnMarkets.id,
      name: 'API Key',
      field_name: 'api_key',
      field_type: 'text',
      is_required: true,
      description: 'Your LN Markets API key',
      order: 1,
    },
  });

  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: lnMarkets.id,
        field_name: 'api_secret',
      },
    },
    update: {},
    create: {
      exchange_id: lnMarkets.id,
      name: 'API Secret',
      field_name: 'api_secret',
      field_type: 'password',
      is_required: true,
      description: 'Your LN Markets API secret',
      order: 2,
    },
  });

  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: lnMarkets.id,
        field_name: 'passphrase',
      },
    },
    update: {},
    create: {
      exchange_id: lnMarkets.id,
      name: 'Passphrase',
      field_name: 'passphrase',
      field_type: 'password',
      is_required: true,
      description: 'Your LN Markets passphrase',
      order: 3,
    },
  });

  console.log('✅ Exchanges seeded successfully - LN Markets only');
}

export const exchangesSeeder = {
  name: 'exchanges',
  description: 'Create exchange configurations and credential types',
  run: async () => {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await seedExchanges(prisma);
      return {
        success: true,
        message: 'Exchanges seeded successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to seed exchanges: ${error.message}`
      };
    } finally {
      await prisma.$disconnect();
    }
  }
};
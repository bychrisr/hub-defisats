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

  // Create Binance exchange (example)
  const binance = await prisma.exchange.upsert({
    where: { slug: 'binance' },
    update: {},
    create: {
      name: 'Binance',
      slug: 'binance',
      description: 'Global cryptocurrency exchange',
      website: 'https://binance.com',
      logo_url: 'https://binance.com/logo.png',
      is_active: true,
      api_version: 'v3',
    },
  });

  // Create credential types for Binance
  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: binance.id,
        field_name: 'api_key',
      },
    },
    update: {},
    create: {
      exchange_id: binance.id,
      name: 'API Key',
      field_name: 'api_key',
      field_type: 'text',
      is_required: true,
      description: 'Your Binance API key',
      order: 1,
    },
  });

  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: binance.id,
        field_name: 'api_secret',
      },
    },
    update: {},
    create: {
      exchange_id: binance.id,
      name: 'API Secret',
      field_name: 'api_secret',
      field_type: 'password',
      is_required: true,
      description: 'Your Binance API secret',
      order: 2,
    },
  });

  // Create Bybit exchange (example)
  const bybit = await prisma.exchange.upsert({
    where: { slug: 'bybit' },
    update: {},
    create: {
      name: 'Bybit',
      slug: 'bybit',
      description: 'Cryptocurrency derivatives exchange',
      website: 'https://bybit.com',
      logo_url: 'https://bybit.com/logo.png',
      is_active: true,
      api_version: 'v5',
    },
  });

  // Create credential types for Bybit
  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: bybit.id,
        field_name: 'api_key',
      },
    },
    update: {},
    create: {
      exchange_id: bybit.id,
      name: 'API Key',
      field_name: 'api_key',
      field_type: 'text',
      is_required: true,
      description: 'Your Bybit API key',
      order: 1,
    },
  });

  await prisma.exchangeCredentialType.upsert({
    where: {
      exchange_id_field_name: {
        exchange_id: bybit.id,
        field_name: 'api_secret',
      },
    },
    update: {},
    create: {
      exchange_id: bybit.id,
      name: 'API Secret',
      field_name: 'api_secret',
      field_type: 'password',
      is_required: true,
      description: 'Your Bybit API secret',
      order: 2,
    },
  });

  console.log('✅ Exchanges seeded successfully');
}
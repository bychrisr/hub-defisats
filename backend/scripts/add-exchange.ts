#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExchangeData {
  name: string;
  slug: string;
  description: string;
  website: string;
  logo_url: string;
  api_version: string;
  credential_types: Array<{
    name: string;
    field_name: string;
    field_type: 'text' | 'password' | 'email' | 'url';
    is_required: boolean;
    description: string;
    order: number;
  }>;
}

async function addExchange(exchangeData: ExchangeData) {
  try {
    console.log('🔄 ADD EXCHANGE - Adding new exchange:', exchangeData.name);

    // Create exchange
    const exchange = await prisma.exchange.create({
      data: {
        name: exchangeData.name,
        slug: exchangeData.slug,
        description: exchangeData.description,
        website: exchangeData.website,
        logo_url: exchangeData.logo_url,
        api_version: exchangeData.api_version,
        is_active: true
      }
    });

    console.log('✅ ADD EXCHANGE - Exchange created:', { id: exchange.id, name: exchange.name });

    // Create credential types
    const credentialTypes = await Promise.all(
      exchangeData.credential_types.map(credType =>
        prisma.exchangeCredentialType.create({
          data: {
            exchange_id: exchange.id,
            name: credType.name,
            field_name: credType.field_name,
            field_type: credType.field_type,
            is_required: credType.is_required,
            description: credType.description,
            order: credType.order
          }
        })
      )
    );

    console.log('✅ ADD EXCHANGE - Credential types created:', credentialTypes.length);

    console.log('🎉 ADD EXCHANGE - Exchange added successfully!');
    console.log('Exchange ID:', exchange.id);
    console.log('Exchange Name:', exchange.name);
    console.log('Credential Types:', credentialTypes.map(ct => ct.name));

    return { exchange, credentialTypes };

  } catch (error) {
    console.error('❌ ADD EXCHANGE - Error adding exchange:', error);
    throw error;
  }
}

// Example: Add Binance exchange
async function addBinanceExchange() {
  const binanceData: ExchangeData = {
    name: 'Binance',
    slug: 'binance',
    description: 'The world\'s leading cryptocurrency exchange',
    website: 'https://binance.com',
    logo_url: 'https://binance.com/favicon.ico',
    api_version: 'v3',
    credential_types: [
      {
        name: 'API Key',
        field_name: 'api_key',
        field_type: 'text',
        is_required: true,
        description: 'Your Binance API key',
        order: 1
      },
      {
        name: 'Secret Key',
        field_name: 'secret_key',
        field_type: 'password',
        is_required: true,
        description: 'Your Binance secret key',
        order: 2
      }
    ]
  };

  return await addExchange(binanceData);
}

// Example: Add Coinbase Pro exchange
async function addCoinbaseProExchange() {
  const coinbaseData: ExchangeData = {
    name: 'Coinbase Pro',
    slug: 'coinbase-pro',
    description: 'Professional cryptocurrency trading platform',
    website: 'https://pro.coinbase.com',
    logo_url: 'https://pro.coinbase.com/favicon.ico',
    api_version: 'v2',
    credential_types: [
      {
        name: 'API Key',
        field_name: 'api_key',
        field_type: 'text',
        is_required: true,
        description: 'Your Coinbase Pro API key',
        order: 1
      },
      {
        name: 'Secret',
        field_name: 'secret',
        field_type: 'password',
        is_required: true,
        description: 'Your Coinbase Pro secret',
        order: 2
      },
      {
        name: 'Passphrase',
        field_name: 'passphrase',
        field_type: 'password',
        is_required: true,
        description: 'Your Coinbase Pro passphrase',
        order: 3
      }
    ]
  };

  return await addExchange(coinbaseData);
}

// Example: Add Kraken exchange
async function addKrakenExchange() {
  const krakenData: ExchangeData = {
    name: 'Kraken',
    slug: 'kraken',
    description: 'Professional cryptocurrency exchange',
    website: 'https://kraken.com',
    logo_url: 'https://kraken.com/favicon.ico',
    api_version: 'v0',
    credential_types: [
      {
        name: 'API Key',
        field_name: 'api_key',
        field_type: 'text',
        is_required: true,
        description: 'Your Kraken API key',
        order: 1
      },
      {
        name: 'Private Key',
        field_name: 'private_key',
        field_type: 'password',
        is_required: true,
        description: 'Your Kraken private key',
        order: 2
      }
    ]
  };

  return await addExchange(krakenData);
}

// Main execution
async function main() {
  const exchangeType = process.argv[2];

  try {
    switch (exchangeType) {
      case 'binance':
        await addBinanceExchange();
        break;
      case 'coinbase-pro':
        await addCoinbaseProExchange();
        break;
      case 'kraken':
        await addKrakenExchange();
        break;
      default:
        console.log('Available exchanges:');
        console.log('  npm run add-exchange binance');
        console.log('  npm run add-exchange coinbase-pro');
        console.log('  npm run add-exchange kraken');
        break;
    }
  } catch (error) {
    console.error('❌ ADD EXCHANGE - Failed to add exchange:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { addExchange, addBinanceExchange, addCoinbaseProExchange, addKrakenExchange };

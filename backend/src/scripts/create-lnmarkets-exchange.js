/**
 * Script para criar a exchange LN Markets
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createLNMarketsExchange() {
  try {
    console.log('🏢 Criando exchange LN Markets...');
    
    // Verificar se já existe
    const existingExchange = await prisma.exchange.findFirst({
      where: {
        name: 'LN Markets'
      }
    });
    
    if (existingExchange) {
      console.log(`✅ Exchange LN Markets já existe: ${existingExchange.id}`);
      return existingExchange;
    }
    
    // Criar a exchange LN Markets
    const exchange = await prisma.exchange.create({
      data: {
        name: 'LN Markets',
        slug: 'lnmarkets',
        description: 'LN Markets - Lightning Network Futures Exchange',
        is_active: true,
        api_documentation_url: 'https://docs.lnmarkets.com',
        supported_features: ['futures', 'lightning', 'testnet']
      }
    });
    
    console.log(`✅ Exchange criada: ${exchange.name} (${exchange.id})`);
    console.log(`🏷️ Slug: ${exchange.slug}`);
    console.log(`📝 Descrição: ${exchange.description}`);
    console.log(`✅ Ativa: ${exchange.is_active}`);
    
    console.log('🎉 Exchange LN Markets criada com sucesso!');
    return exchange;
    
  } catch (error) {
    console.error('❌ Erro ao criar exchange:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createLNMarketsExchange();

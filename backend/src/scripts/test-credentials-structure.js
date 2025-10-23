/**
 * Script para testar a estrutura das credenciais
 * e verificar se há diferenças entre mainnet e testnet
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testCredentialsStructure() {
  console.log('🔍 TESTING CREDENTIALS STRUCTURE');
  console.log('=====================================');

  try {
    // Buscar usuário
    const user = await prisma.user.findFirst({
      where: { email: 'brainoschris@gmail.com' },
    });

    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.email} (${user.id})`);

    // Buscar conta de exchange
    const account = await prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: user.id,
        is_active: true
      },
      include: {
        exchange: true
      }
    });

    if (!account) {
      console.error('❌ Conta de exchange não encontrada');
      return;
    }

    console.log(`✅ Conta encontrada: ${account.account_name} (${account.exchange.name})`);
    console.log('📋 Credenciais brutas do banco:', account.credentials);

    // Testar detecção de testnet
    const { TestnetDetector } = await import('../utils/testnet-detector');
    const testnetResult = TestnetDetector.detectTestnet(account.credentials);
    console.log('🌐 Testnet detection result:', testnetResult);

    // Simular como as credenciais são passadas para o LNMarketsClient
    const credentialsForClient = {
      apiKey: account.credentials['API Key'],
      apiSecret: account.credentials['API Secret'],
      passphrase: account.credentials['Passphrase'],
      isTestnet: testnetResult.isTestnet
    };

    console.log('🔑 Credenciais para LNMarketsClient:', {
      hasApiKey: !!credentialsForClient.apiKey,
      hasApiSecret: !!credentialsForClient.apiSecret,
      hasPassphrase: !!credentialsForClient.passphrase,
      isTestnet: credentialsForClient.isTestnet,
      apiKeyLength: credentialsForClient.apiKey ? credentialsForClient.apiKey.length : 0,
      apiSecretLength: credentialsForClient.apiSecret ? credentialsForClient.apiSecret.length : 0,
      passphraseLength: credentialsForClient.passphrase ? credentialsForClient.passphrase.length : 0
    });

    // Verificar se as credenciais estão descriptografadas
    console.log('🔍 Verificando descriptografia:');
    console.log('- API Key descriptografada:', credentialsForClient.apiKey);
    console.log('- API Secret descriptografada:', credentialsForClient.apiSecret);
    console.log('- Passphrase descriptografada:', credentialsForClient.passphrase);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCredentialsStructure();

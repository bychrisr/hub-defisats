/**
 * Script para testar descriptografia direta
 * Comparar mainnet vs testnet
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDecryptionDirect() {
  console.log('🔐 TESTING DIRECT DECRYPTION');
  console.log('============================');

  try {
    // Buscar usuário
    const user = await prisma.user.findFirst({
      where: { email: 'brainoschris@gmail.com' },
    });

    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }

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

    // Testar descriptografia usando o mesmo método do UserExchangeAccountService
    const encryptionKey = process.env.ENCRYPTION_KEY || 'development-encryption-key-32-chars';
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    
    console.log('🔑 Encryption key:', encryptionKey);
    console.log('🔑 Derived key length:', key.length);

    const decryptedCredentials = {};

    Object.entries(account.credentials).forEach(([key, value]) => {
      console.log(`\n🔍 Processing ${key}:`);
      console.log(`  Raw value: ${value}`);
      
      if (key === 'isTestnet') {
        decryptedCredentials[key] = value;
        console.log(`  ✅ Plain text: ${value}`);
        return;
      }

      if (value && typeof value === 'string') {
        try {
          const parts = value.split(':');
          if (parts.length === 2) {
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            
            console.log(`  IV Buffer length: ${iv.length}`);
            console.log(`  Encrypted length: ${encrypted.length}`);
            
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            decryptedCredentials[key] = decrypted;
            console.log(`  ✅ Decrypted: ${decrypted}`);
          } else {
            console.log(`  ⚠️ Not in encrypted format, using as plain text`);
            decryptedCredentials[key] = value;
          }
        } catch (error) {
          console.log(`  ❌ Decryption failed: ${error.message}`);
          decryptedCredentials[key] = '';
        }
      }
    });

    console.log('\n📋 FINAL DECRYPTED CREDENTIALS:');
    console.log(decryptedCredentials);

    // Testar detecção de testnet
    const { TestnetDetector } = await import('../utils/testnet-detector');
    const testnetResult = TestnetDetector.detectTestnet(decryptedCredentials);
    console.log('\n🌐 Testnet detection result:', testnetResult);

    // Simular como as credenciais são passadas para o LNMarketsClient
    const credentialsForClient = {
      apiKey: decryptedCredentials['API Key'],
      apiSecret: decryptedCredentials['API Secret'],
      passphrase: decryptedCredentials['Passphrase'],
      isTestnet: testnetResult.isTestnet
    };

    console.log('\n🔑 Credenciais para LNMarketsClient:');
    console.log({
      hasApiKey: !!credentialsForClient.apiKey,
      hasApiSecret: !!credentialsForClient.apiSecret,
      hasPassphrase: !!credentialsForClient.passphrase,
      isTestnet: credentialsForClient.isTestnet,
      apiKeyLength: credentialsForClient.apiKey ? credentialsForClient.apiKey.length : 0,
      apiSecretLength: credentialsForClient.apiSecret ? credentialsForClient.apiSecret.length : 0,
      passphraseLength: credentialsForClient.passphrase ? credentialsForClient.passphrase.length : 0
    });

    // Verificar se as credenciais estão corretas
    const expectedCredentials = {
      'API Key': 'jq+tOHNmhmSiq03Wo/jSASgDPMc3pmSjGUi52oFAB7Y=',
      'API Secret': '6WwAWg3ZGPezHI8vLTtocLOUS+qzK95grml+2Knjd3hOkGEkICd4/i+RmPEvnEuAX5Ocy2/DiE2UZ0ot6G1QWA==',
      'Passphrase': '66fg3b0f9h7f3'
    };

    console.log('\n🔍 Verificando se as credenciais descriptografadas estão corretas:');
    console.log('API Key correto:', decryptedCredentials['API Key'] === expectedCredentials['API Key']);
    console.log('API Secret correto:', decryptedCredentials['API Secret'] === expectedCredentials['API Secret']);
    console.log('Passphrase correto:', decryptedCredentials['Passphrase'] === expectedCredentials['Passphrase']);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDecryptionDirect();

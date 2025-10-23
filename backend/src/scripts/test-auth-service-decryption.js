/**
 * Script para testar descriptografia usando o método exato do AuthService
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testAuthServiceDecryption() {
  console.log('🔐 TESTING AUTH SERVICE DECRYPTION');
  console.log('===================================');

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

    // Usar o método exato do AuthService
    const encryptionKey = process.env.ENCRYPTION_KEY;
    console.log('🔑 Encryption key:', encryptionKey);
    console.log('🔑 Encryption key length:', encryptionKey.length);

    // Simular o método decryptData do AuthService
    function decryptData(encryptedData) {
      const algorithm = 'aes-256-cbc';
      
      // Usar chave em cache ou criar uma vez (como no AuthService)
      const key = crypto.scryptSync(encryptionKey, 'salt', 32);
      console.log('🔑 Derived key length:', key.length);
      
      const parts = encryptedData.split(':');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      console.log('🔍 Decryption details:', {
        ivLength: iv.length,
        encryptedLength: encrypted.length,
        keyLength: key.length
      });

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    const decryptedCredentials = {};

    // Usar Object.keys para evitar corrupção das chaves
    const keys = Object.keys(account.credentials);
    for (const key of keys) {
      const value = account.credentials[key];
      console.log(`\n🔍 Processing ${key}:`);
      console.log(`  Raw value: ${value}`);
      
      if (key === 'isTestnet') {
        decryptedCredentials[key] = value;
        console.log(`  ✅ Plain text: ${value}`);
        continue;
      }

      if (value && typeof value === 'string') {
        try {
          const decrypted = decryptData(value);
          decryptedCredentials[key] = decrypted;
          console.log(`  ✅ Decrypted: ${decrypted}`);
        } catch (error) {
          console.log(`  ❌ Decryption failed: ${error.message}`);
          decryptedCredentials[key] = '';
        }
      }
    }

    console.log('\n📋 FINAL DECRYPTED CREDENTIALS:');
    console.log(decryptedCredentials);

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

testAuthServiceDecryption();

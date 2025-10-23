/**
 * Script para configurar credenciais de testnet para o usuário brainoschris@gmail.com
 * Com as credenciais fornecidas pelo usuário
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Credenciais de testnet fornecidas pelo usuário
const TESTNET_CREDENTIALS = {
  'API Key': 'jq+tOHNmhmSiq03Wo/jSASgDPMc3pmSjGUi52oFAB7Y=',
  'API Secret': '6WwAWg3ZGPezHI8vLTtocLOUS+qzK95grml+2Knjd3hOkGEkICd4/i+RmPEvnEuAX5Ocy2/DiE2UZ0ot6G1QWA==',
  'Passphrase': '66fg3b0f9h7f3',
  'isTestnet': 'true'
};

async function setupTestnetCredentials() {
  try {
    console.log('🔐 Configurando credenciais de testnet para LN Markets...');
    
    // Buscar o usuário
    const user = await prisma.user.findFirst({
      where: {
        email: 'brainoschris@gmail.com'
      }
    });
    
    if (!user) {
      console.error('❌ Usuário não encontrado');
      return;
    }
    
    console.log(`✅ Usuário encontrado: ${user.email} (${user.id})`);
    
    // Buscar a exchange LN Markets
    const exchange = await prisma.exchange.findFirst({
      where: {
        name: 'LN Markets'
      }
    });
    
    if (!exchange) {
      console.error('❌ Exchange LN Markets não encontrada');
      return;
    }
    
    console.log(`✅ Exchange encontrada: ${exchange.name} (${exchange.id})`);
    
    // Criptografar as credenciais usando o mesmo método do AuthService
    const encryptionKey = process.env.ENCRYPTION_KEY;
    console.log('🔑 Using encryption key:', encryptionKey);
    const algorithm = 'aes-256-cbc';
    
    const encryptedCredentials = {};
    for (const [key, value] of Object.entries(TESTNET_CREDENTIALS)) {
      if (key === 'isTestnet') {
        // isTestnet não precisa ser criptografado
        encryptedCredentials[key] = value;
      } else {
        const iv = crypto.randomBytes(16);
        const keyBuffer = crypto.scryptSync(encryptionKey, 'salt', 32);
        const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
        
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Formato esperado: iv:encrypted
        encryptedCredentials[key] = `${iv.toString('hex')}:${encrypted}`;
      }
    }
    
    console.log('🔐 Credenciais criptografadas');
    
    // Verificar se já existe uma conta para este usuário
    const existingAccount = await prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: user.id,
        exchange_id: exchange.id
      }
    });
    
    if (existingAccount) {
      console.log('📝 Atualizando conta existente...');
      
      // Atualizar a conta existente
      const updatedAccount = await prisma.userExchangeAccounts.update({
        where: {
          id: existingAccount.id
        },
        data: {
          account_name: 'TESTNET',
          is_active: true,
          is_verified: false,
          credentials: encryptedCredentials
        }
      });
      
      console.log(`✅ Conta atualizada: ${updatedAccount.id}`);
    } else {
      console.log('🆕 Criando nova conta de exchange...');
      
      // Criar nova conta de exchange
      const exchangeAccount = await prisma.userExchangeAccounts.create({
        data: {
          user_id: user.id,
          exchange_id: exchange.id,
          account_name: 'TESTNET',
          is_active: true,
          is_verified: false,
          credentials: encryptedCredentials
        }
      });
      
      console.log(`✅ Conta criada: ${exchangeAccount.id}`);
    }
    
    console.log(`📧 Usuário: ${user.email}`);
    console.log(`🏢 Exchange: ${exchange.name}`);
    console.log(`🏷️ Nome da conta: TESTNET`);
    console.log(`✅ Ativa: true`);
    console.log(`🌐 Testnet: true`);
    
    console.log('🎉 Credenciais de testnet configuradas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar credenciais:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestnetCredentials();

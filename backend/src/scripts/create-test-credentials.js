/**
 * Script para criar credenciais de teste para LN Markets
 * Este script cria credenciais de testnet para o usuário brainoschris@gmail.com
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Credenciais de teste para LN Markets Testnet
const TEST_CREDENTIALS = {
  'API Key': 'test_api_key_12345',
  'API Secret': 'test_api_secret_67890',
  'Passphrase': 'test_passphrase',
  'isTestnet': 'true'
};

async function createTestCredentials() {
  try {
    console.log('🔐 Criando credenciais de teste para LN Markets...');
    
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
    
    // Criptografar as credenciais
    const encryptionKey = process.env.ENCRYPTION_KEY || 'development-encryption-key-32-chars';
    const algorithm = 'aes-256-gcm';
    
    const encryptedCredentials = {};
    for (const [key, value] of Object.entries(TEST_CREDENTIALS)) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, encryptionKey);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      encryptedCredentials[key] = encrypted;
    }
    
    console.log('🔐 Credenciais criptografadas');
    
    // Criar a conta de exchange
    const exchangeAccount = await prisma.userExchangeAccount.create({
      data: {
        user_id: user.id,
        exchange_id: exchange.id,
        account_name: 'TESTNET',
        is_active: true,
        is_verified: false,
        credentials: encryptedCredentials
      }
    });
    
    console.log(`✅ Conta de exchange criada: ${exchangeAccount.id}`);
    console.log(`📧 Usuário: ${user.email}`);
    console.log(`🏢 Exchange: ${exchange.name}`);
    console.log(`🏷️ Nome da conta: ${exchangeAccount.account_name}`);
    console.log(`✅ Ativa: ${exchangeAccount.is_active}`);
    
    console.log('🎉 Credenciais de teste criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar credenciais:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCredentials();

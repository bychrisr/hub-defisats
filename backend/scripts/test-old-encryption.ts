import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para descriptografar dados com a chave antiga
function decryptDataOldKey(encryptedData: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('dev_encryption_key_32_chars_long', 'salt', 32);

  const parts = encryptedData.split(':');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0] as string, 'hex');
  const encrypted = parts[1] as string;

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

async function testOldEncryption() {
  try {
    console.log('🧪 TESTING OLD ENCRYPTION - Starting test with old key...');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { 
        id: true, 
        email: true,
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);
    console.log(`📊 Credential lengths: API Key: ${user.ln_markets_api_key?.length}, Secret: ${user.ln_markets_api_secret?.length}, Passphrase: ${user.ln_markets_passphrase?.length}`);

    // Testar descriptografia com a chave antiga
    try {
      const decryptedApiKey = decryptDataOldKey(user.ln_markets_api_key!);
      console.log(`🔓 Decrypted API Key (old key): ${decryptedApiKey}`);
      
      if (decryptedApiKey !== 'your_api_key_here') {
        console.log('✅ API Key is NOT a placeholder - it looks like real credentials!');
      } else {
        console.log('❌ API Key is still a placeholder');
      }
    } catch (error) {
      console.error('❌ API Key decryption error with old key:', error);
    }

    try {
      const decryptedApiSecret = decryptDataOldKey(user.ln_markets_api_secret!);
      console.log(`🔓 Decrypted API Secret (old key): ${decryptedApiSecret}`);
      
      if (decryptedApiSecret !== 'your_api_secret_here') {
        console.log('✅ API Secret is NOT a placeholder - it looks like real credentials!');
      } else {
        console.log('❌ API Secret is still a placeholder');
      }
    } catch (error) {
      console.error('❌ API Secret decryption error with old key:', error);
    }

    try {
      const decryptedPassphrase = decryptDataOldKey(user.ln_markets_passphrase!);
      console.log(`🔓 Decrypted Passphrase (old key): ${decryptedPassphrase}`);
      
      if (decryptedPassphrase !== '#Lobinho123') {
        console.log('✅ Passphrase is NOT the test value - it looks like real credentials!');
      } else {
        console.log('❌ Passphrase is still the test value');
      }
    } catch (error) {
      console.error('❌ Passphrase decryption error with old key:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing old encryption:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOldEncryption();

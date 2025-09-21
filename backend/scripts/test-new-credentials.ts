import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para descriptografar dados com a chave correta
function decryptData(encryptedData: string): string {
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

async function testNewCredentials() {
  try {
    console.log('🧪 TESTING NEW CREDENTIALS - Starting test...');
    
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

    // Testar descriptografia
    try {
      const decryptedApiKey = decryptData(user.ln_markets_api_key!);
      console.log(`🔓 Decrypted API Key: ${decryptedApiKey}`);
      
      if (decryptedApiKey === 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=') {
        console.log('✅ API Key decryption SUCCESS!');
      } else {
        console.log('❌ API Key decryption FAILED - values do not match');
      }
    } catch (error) {
      console.error('❌ API Key decryption error:', error);
    }

    try {
      const decryptedApiSecret = decryptData(user.ln_markets_api_secret!);
      console.log(`🔓 Decrypted API Secret: ${decryptedApiSecret}`);
      
      if (decryptedApiSecret === 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==') {
        console.log('✅ API Secret decryption SUCCESS!');
      } else {
        console.log('❌ API Secret decryption FAILED - values do not match');
      }
    } catch (error) {
      console.error('❌ API Secret decryption error:', error);
    }

    try {
      const decryptedPassphrase = decryptData(user.ln_markets_passphrase!);
      console.log(`🔓 Decrypted Passphrase: ${decryptedPassphrase}`);
      
      if (decryptedPassphrase === '#PassCursor') {
        console.log('✅ Passphrase decryption SUCCESS!');
      } else {
        console.log('❌ Passphrase decryption FAILED - values do not match');
      }
    } catch (error) {
      console.error('❌ Passphrase decryption error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing new credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewCredentials();

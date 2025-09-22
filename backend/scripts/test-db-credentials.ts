import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para descriptografar dados (mesma do AuthService)
function decryptData(encryptedData: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('development-encryption-key-32-chars', 'salt', 32);

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

async function testDBCredentials() {
  try {
    console.log('🧪 TESTING DB CREDENTIALS - Starting database credentials test...');
    
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

    // Testar descriptografia da passphrase
    try {
      const decryptedPassphrase = decryptData(user.ln_markets_passphrase!);
      console.log(`🔓 Decrypted passphrase: ${decryptedPassphrase}`);
      
      if (decryptedPassphrase === '#Lobinho123') {
        console.log('✅ Passphrase decryption SUCCESS!');
      } else {
        console.log('❌ Passphrase decryption FAILED - wrong value');
      }
    } catch (error) {
      console.error('❌ Passphrase decryption error:', error);
    }

    // Testar descriptografia da API Key
    try {
      const decryptedApiKey = decryptData(user.ln_markets_api_key!);
      console.log(`🔓 Decrypted API Key: ${decryptedApiKey}`);
    } catch (error) {
      console.error('❌ API Key decryption error:', error);
    }

    // Testar descriptografia da API Secret
    try {
      const decryptedApiSecret = decryptData(user.ln_markets_api_secret!);
      console.log(`🔓 Decrypted API Secret: ${decryptedApiSecret}`);
    } catch (error) {
      console.error('❌ API Secret decryption error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error testing DB credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDBCredentials();

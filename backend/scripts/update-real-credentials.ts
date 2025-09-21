import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para criptografar dados com a chave correta
function encryptData(data: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('dev_encryption_key_32_chars_long', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

async function updateRealCredentials() {
  try {
    console.log('🔧 UPDATING REAL CREDENTIALS - Starting credential update...');
    
    // Credenciais reais da LN Markets
    const realCredentials = {
      apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
      apiSecret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
      passphrase: '#PassCursor'
    };

    console.log('🔐 Encrypting credentials with correct key...');
    
    const encryptedApiKey = encryptData(realCredentials.apiKey);
    const encryptedApiSecret = encryptData(realCredentials.apiSecret);
    const encryptedPassphrase = encryptData(realCredentials.passphrase);

    console.log('✅ Credentials encrypted successfully');

    // Atualizar o usuário no banco de dados
    await prisma.user.update({
      where: { email: 'brainoschris@gmail.com' },
      data: {
        ln_markets_api_key: encryptedApiKey,
        ln_markets_api_secret: encryptedApiSecret,
        ln_markets_passphrase: encryptedPassphrase,
      },
    });

    console.log('✅ Credentials updated in database successfully');
    console.log('🎉 Credential update completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart the backend container: docker restart hub-defisats-backend');
    console.log('2. Test the LN Markets integration');
    
  } catch (error) {
    console.error('❌ Error updating credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRealCredentials();

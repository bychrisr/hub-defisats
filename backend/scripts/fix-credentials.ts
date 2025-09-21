import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para criptografar dados (mesma do AuthService)
function encryptData(data: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync('development-encryption-key-32-chars', 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

async function fixCredentials() {
  try {
    console.log('🔧 FIXING CREDENTIALS - Starting credential fix process...');
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: 'brainoschris@gmail.com' },
      select: { id: true, email: true }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);

    // Credenciais válidas fornecidas
    const validCredentials = {
      apiKey: 'your_api_key_here', // Substituir pela chave real
      apiSecret: 'your_api_secret_here', // Substituir pelo secret real
      passphrase: '#Lobinho123'
    };

    // Criptografar as credenciais com a chave correta
    console.log('🔐 Encrypting credentials with correct key...');
    
    const encryptedApiKey = encryptData(validCredentials.apiKey);
    const encryptedApiSecret = encryptData(validCredentials.apiSecret);
    const encryptedPassphrase = encryptData(validCredentials.passphrase);

    console.log('✅ Credentials encrypted successfully');

    // Atualizar no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ln_markets_api_key: encryptedApiKey,
        ln_markets_api_secret: encryptedApiSecret,
        ln_markets_passphrase: encryptedPassphrase
      }
    });

    console.log('✅ Credentials updated in database successfully');
    console.log('🎉 Credential fix completed!');

  } catch (error) {
    console.error('❌ Error fixing credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCredentials();

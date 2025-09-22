import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Função para descriptografar dados com uma chave específica
function decryptDataWithKey(encryptedData: string, keyString: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(keyString, 'salt', 32);

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

async function testMultipleKeys() {
  try {
    console.log('🧪 TESTING MULTIPLE KEYS - Starting test with different keys...');
    
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

    // Lista de chaves possíveis para testar
    const possibleKeys = [
      'dev_encryption_key_32_chars_long',
      'development-encryption-key-32-chars',
      'dev_encryption_key_32_chars',
      'development_encryption_key_32_chars',
      'dev-encryption-key-32-chars',
      'development_encryption_key_32_chars_long',
      'dev_encryption_key_32_chars_longer',
      'development-encryption-key-32-chars-long',
      'dev_encryption_key_32_chars_longer_than_32',
      'development_encryption_key_32_chars_longer_than_32'
    ];

    console.log(`🔍 Testing ${possibleKeys.length} possible keys...`);

    for (const keyString of possibleKeys) {
      console.log(`\n🔑 Testing key: ${keyString}`);
      
      try {
        const decryptedApiKey = decryptDataWithKey(user.ln_markets_api_key!, keyString);
        console.log(`✅ API Key decrypted: ${decryptedApiKey}`);
        
        if (decryptedApiKey !== 'your_api_key_here' && decryptedApiKey.length > 10) {
          console.log('🎉 FOUND REAL API KEY!');
          
          try {
            const decryptedApiSecret = decryptDataWithKey(user.ln_markets_api_secret!, keyString);
            console.log(`✅ API Secret decrypted: ${decryptedApiSecret}`);
            
            if (decryptedApiSecret !== 'your_api_secret_here' && decryptedApiSecret.length > 10) {
              console.log('🎉 FOUND REAL API SECRET!');
              
              try {
                const decryptedPassphrase = decryptDataWithKey(user.ln_markets_passphrase!, keyString);
                console.log(`✅ Passphrase decrypted: ${decryptedPassphrase}`);
                
                if (decryptedPassphrase !== '#Lobinho123' && decryptedPassphrase.length > 5) {
                  console.log('🎉 FOUND REAL PASSPHRASE!');
                  console.log('\n🎉 ALL CREDENTIALS FOUND WITH KEY:', keyString);
                  console.log('API Key:', decryptedApiKey);
                  console.log('API Secret:', decryptedApiSecret);
                  console.log('Passphrase:', decryptedPassphrase);
                  return;
                }
              } catch (error) {
                console.log('❌ Passphrase decryption failed');
              }
            }
          } catch (error) {
            console.log('❌ API Secret decryption failed');
          }
        }
      } catch (error) {
        console.log('❌ API Key decryption failed');
      }
    }
    
    console.log('\n❌ No valid key found for decryption');
    
  } catch (error) {
    console.error('❌ Error testing multiple keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultipleKeys();

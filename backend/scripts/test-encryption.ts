import crypto from 'crypto';

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

async function testEncryption() {
  try {
    console.log('🧪 TESTING ENCRYPTION - Starting encryption test...');
    
    const testData = '#Lobinho123';
    console.log(`📝 Original data: ${testData}`);
    
    // Criptografar
    const encrypted = encryptData(testData);
    console.log(`🔐 Encrypted data: ${encrypted}`);
    
    // Descriptografar
    const decrypted = decryptData(encrypted);
    console.log(`🔓 Decrypted data: ${decrypted}`);
    
    // Verificar se são iguais
    if (testData === decrypted) {
      console.log('✅ Encryption/Decryption test PASSED!');
    } else {
      console.log('❌ Encryption/Decryption test FAILED!');
    }
    
  } catch (error) {
    console.error('❌ Error testing encryption:', error);
  }
}

testEncryption();

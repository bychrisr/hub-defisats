/**
 * Script para testar a descriptografia das credenciais
 */

const crypto = require('crypto');

// Simular a descriptografia como no UserExchangeAccountService
function testDecryption() {
  console.log('🔐 TESTING DECRYPTION');
  console.log('=====================');

  // Credenciais criptografadas do banco
  const encryptedCredentials = {
    'API Key': '92711173717aa39f417b2d0f33cc8f78:72da7c94757f5de5243e04a044c1858618eb0b4bc9ccddea272352d520d632312f3e3606b4014bb2afb987a0c5eab2e5',
    'API Secret': '8071ad79d5aa7b03a2ada5a48a85b6be:97cba42fac1dab3f12a00929f2db6d5cf31c77c53b46c5febd8af9d1e5670d62998bd59d2bef804d071192fa09ae22d45931e7b221562b922fbfc0e527a6290f689e18d1344e9ea9a001e41a18abedf41c7c8451c3d4e2b9e86f33ba93f1ed2b',
    'Passphrase': 'e2b91c32c12956a7e913285a0ab07dc8:843383e356ddbf3624c78e69d73deca2',
    'isTestnet': 'true'
  };

  // Chave de criptografia (mesma do .env)
  const encryptionKey = process.env.ENCRYPTION_KEY || 'development-encryption-key-32-chars';
  console.log('🔑 Encryption key length:', encryptionKey.length);
  console.log('🔑 Encryption key:', encryptionKey);

  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  console.log('🔑 Derived key length:', key.length);

  const decryptedCredentials = {};

  Object.entries(encryptedCredentials).forEach(([key, value]) => {
    console.log(`\n🔍 Processing ${key}:`);
    console.log(`  Raw value: ${value}`);
    
    if (key === 'isTestnet') {
      // isTestnet não precisa ser descriptografado
      decryptedCredentials[key] = value;
      console.log(`  ✅ Plain text: ${value}`);
      return;
    }

    if (value && typeof value === 'string') {
      try {
        // Extrair IV e dados criptografados
        const [ivHex, encryptedHex] = value.split(':');
        console.log(`  IV: ${ivHex}`);
        console.log(`  Encrypted: ${encryptedHex}`);
        
        if (!ivHex || !encryptedHex) {
          console.log(`  ⚠️ Not in encrypted format, using as plain text`);
          decryptedCredentials[key] = value;
          return;
        }
        
        const iv = Buffer.from(ivHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        
        console.log(`  IV Buffer length: ${iv.length}`);
        console.log(`  Encrypted Buffer length: ${encrypted.length}`);
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        decryptedCredentials[key] = decrypted;
        console.log(`  ✅ Decrypted: ${decrypted}`);
      } catch (error) {
        console.log(`  ❌ Decryption failed: ${error.message}`);
        decryptedCredentials[key] = '';
      }
    }
  });

  console.log('\n📋 FINAL DECRYPTED CREDENTIALS:');
  console.log(decryptedCredentials);
}

testDecryption();

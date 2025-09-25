const axios = require('axios');
const crypto = require('crypto');

// Credenciais fornecidas
const credentials = {
  apiKey: 'q4dbbRpWE2ZpfPV3GBqAFNLfQhXrcab2quz8FsxGZ7U=',
  apiSecret: 'bq9WimSkASMQo0eJ4IzVv6P7hC+OEY4GLnB+ztVrcfkA3XbL7826/fkUgHe8+2TZL6+J8NM2/RnTn3D/6gyE4A==',
  passphrase: '#PassCursor'
};

// Configuração da API
// const baseURL = 'https://api.lnmarkets.com/v2'; // Produção
const baseURL = 'https://api.testnet4.lnmarkets.com/v2'; // Testnet

// Função para criar assinatura
function createSignature(timestamp, method, path, body, secret) {
  const message = timestamp + method + path + (body || '');
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

// Função para testar credenciais
async function testCredentials() {
  try {
    console.log('🔍 Testando credenciais da LN Markets...');
    console.log('📋 Credenciais:', {
      apiKey: credentials.apiKey.substring(0, 10) + '...',
      apiSecret: credentials.apiSecret.substring(0, 10) + '...',
      passphrase: credentials.passphrase
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/user';
    const body = '';

    const signature = createSignature(timestamp, method, path, body, credentials.apiSecret);

    const response = await axios.get(`${baseURL}${path}`, {
      headers: {
        'LNM-ACCESS-KEY': credentials.apiKey,
        'LNM-ACCESS-SIGNATURE': signature,
        'LNM-ACCESS-TIMESTAMP': timestamp,
        'LNM-ACCESS-PASSPHRASE': credentials.passphrase,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Sucesso! Credenciais válidas');
    console.log('📊 Resposta:', response.data);
    return true;

  } catch (error) {
    console.log('❌ Erro ao testar credenciais');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Mensagem:', error.response?.data || error.message);
    return false;
  }
}

// Executar teste
testCredentials();
